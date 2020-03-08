import axios from "axios";
import * as rax from "retry-axios";
import utils from "./utils.js";
import config from "../config.json";

const interceptorId = rax.attach();

const requestTimetable = async (id, search_options) => {
	// Function makes a request to airbnb API for
	// the timetable of a particular listing id

	// Convert start and end date to another 
	// format required by the airbnb request
	let [start_month, start_year, month_amount] = utils.getStartAndInterval(
		search_options.start_date, 
		search_options.end_date
	);

	let response = await axios.get(config.api.airbnb.address + config.api.airbnb.timetable, {
		raxConfig: {
			retry: 20,
			onRetryAttempt: err => {
				const cfg = rax.getConfig(err);
				console.log(`Retry attempt #${cfg.currentRetryAttempt} for listing id ${id}`);
			}
		},
		params: {
			"key": config.api.airbnb.key,
			"listing_id": id,	
			"month": start_month,
			"year": start_year,
			"count": month_amount
		}
	})

	return response.data.calendar_months
}		

const getTimetable = async (id, search_options) => {
	// Function requests for timetable and formats
	// the response into a timetable object

	let days = [];

	// Make a request for timetable
	let timetable = await requestTimetable(id, search_options);

	timetable.map( (month) => {
		month.days.map( (day) => {

			// Only add the days in between the provided start and end date
			if (day.date >= search_options.start_date && day.date <= search_options.end_date) {
				days.push({
					"date": day.date,
					"available": day.available,
					"price": day.price.local_price_formatted
				});
			}
		})
	});

	return ({
		"id": id,
		"timetable_days": days
	});
}

const allTimetables = async (listings, search_options) => {
	// Function finds the timetable for each listing and
	// returns a list of timetable objects

	console.log("Finding timetables for each listing")

	let timetables = [],
		promises = [],
		current_percentage = 0,
		new_percentage = 0;

	// Convert listings from Set to List
	listings = Array.from(listings)

	for (let id of listings) {
		promises.push(await getTimetable(id, search_options));

		if (promises.length == config.maximum_concurrency || id == listings[listings.length - 1]) {
			await Promise.all(promises)
				.then( (data) => {
					data.map( (timetable) => {
						timetables.push(timetable);
					})

					// Percentage indicator, will log every 10%
					new_percentage = (timetables.length / listings.length) * 100
					new_percentage = Math.floor(new_percentage / 10) * 10;
					if (new_percentage != current_percentage) {
						console.log(new_percentage+"%")
						current_percentage = new_percentage;
					}

					promises = [];
				});
		}
	}

	console.log("Processed", timetables.length, "listings for their timetable");

	return timetables
}

export default {
	allTimetables
}

