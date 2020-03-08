import axios from "axios";
import * as rax from "retry-axios";
import config from "../config.json";

const checkDays = (days) => {
	// Function loops through the given days
	// and check if any are unavailable, if 
	// not then find the price for these days

	let total_price = 0;

	for (let day of days) {
		if (day.available) {
			total_price += parseInt(day.price);
		}

		// Not available, then stop and return -1
		else {
			return -1;
		}
	}

	// If all are available, then return the price
	return total_price
}

const checkFullPrice = async (id, check_in, check_out, search_options) => {
	// Function makes a request to the airbnb API for 
	// the full price given the check in and out time
	// and the amount of people thats going to be staying

	let response = await axios.get(config.api.airbnb.address + config.api.airbnb.pricing, {
		raxConfig: {
			retry: 20,
			onRetryAttempt: err => {
				const cfg = rax.getConfig(err);
				console.log(`Retry attempt #${cfg.currentRetryAttempt} for timetable id ${id}`);
			}
		},
		params: {
			"_format": "for_web_with_date",
			"key": config.api.airbnb.key,
			"currency": search_options.currency,
			"listing_id": id,
			"check_in": check_in,
			"check_out": check_out, 
			"number_of_adults": search_options.adults,
			"number_of_children": search_options.children,
			"number_of_infants": search_options.infants
		}
	});

	// Retrive the price from the response data
	let price = response.data.pdp_listing_booking_details[0].bar_price.display_prices[0].price_string;
	return price;
}

const checkLowestAvailable = async (timetable_obj, search_options) => {
	// Function checks all intervals that are days_staying long
	// within the timetable given and find if their price if
	// available, then get the days with the lowest pricing

	let timetable = timetable_obj.timetable_days,
		curr_min_price = -1,
		after_guest_price = "-1",
		days = new Set();

	for (let i=0; i<timetable.length; i++) {

		// For each day, see if there is enough days from
		// now to the last day before checking price
		if (timetable.length - i >= search_options.days_staying) {

			// See if all the days between now and days_staying 
			// later are available and its price
			let days_to_check = timetable.slice(i, i+search_options.days_staying),
				price = await checkDays(days_to_check);

			// Price as -1 means not all days are available
			if (price != -1) {

				// When min price hasnt been set or a new min has been found
				if (curr_min_price == -1 || price < curr_min_price) {

					// Set new min
					curr_min_price = price;

					// As the price is different depending on how many
					// people are staying, so this is the actual price,
					// reason why we dont use this after_guest_price for
					// logic is because every iteration we will have to
					// make a request to airbnb API which is not good where 
					// this way we only make a request if theres a new min
					after_guest_price = await checkFullPrice(
						timetable_obj.id, 
						days_to_check[0].date, 
						days_to_check[days_to_check.length -1].date,
						search_options
					);

					// Reset lowest available days and include the new ones
					days = new Set();
					for (let day of days_to_check) {
						days.add(day.date);
					}
				}

				// When the price is the same as current min
				else if (price == curr_min_price) {

					// Include the days, if it overlaps
					// the Set will take care of it
					for (let day of days_to_check) {
						days.add(day.date);
					}
				}
			} 
		}
	}

	// Price format from the airbnb API is in 123,456,789.01,
	// have to convert it from that to a float for sorting
	after_guest_price = parseFloat(after_guest_price.replace(/[^0-9.-]+/g,""))
	return {
		"id": timetable_obj.id,
		"price": after_guest_price,
		"days": Array.from(days)
	}
}

const getPricing = async (timetables, search_options) => {
	// Function finds the lowest price for available timetables
	// and returns it as a list in increasing order

	console.log("Finding pricing for each timetable");

	let lowest_available = [],
		results = [],
		promises = [],
		current_percentage = 0,
		new_percentage = 0;

	for (let t of timetables) {
		promises.push(await checkLowestAvailable(t, search_options))

		if (promises.length == config.maximum_concurrency || t == timetables[timetables.length - 1]) {
			await Promise.all(promises)
				.then( (data) => {
					data.map( (timetable_pricing) => {

						// Add all timetable pricing, even the unavailable ones
						results.push(timetable_pricing)
					})

					// Percentage indicator, will log every 10%
					new_percentage = (results.length / timetables.length) * 100
					new_percentage = Math.floor(new_percentage / 10) * 10;
					if (new_percentage != current_percentage) {
						console.log(new_percentage+"%")
						current_percentage = new_percentage;
					}

					promises = [];
				}); 
		}
	}

	// Remove all unavailable timetables
	results.map( (timetable) => {
		if (timetable.price != -1) {
			lowest_available.push(timetable);
		}
	});

	// Sort the timetables by their price, from lowest to highest	
	lowest_available.sort(
		(a, b) => (a.price > b.price) ? 1 : ((b.price > a.price) ? -1 : 0)
	);

	console.log("Found pricing for", lowest_available.length, "available timetables");

	return lowest_available;
}

export default {
	getPricing
}