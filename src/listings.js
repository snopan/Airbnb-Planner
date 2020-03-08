import axios from "axios";
import * as rax from "retry-axios";
import config from "../config.json";

const interceptorId = rax.attach();

const requestListings = async (location, search_options, skip_amount) => {
	// Function makes a request to airbnb API for a page
	// of listings given the location and other parameters

	let response,
		sections,
		apartments;

	response = await axios.get(config.api.airbnb.address + config.api.airbnb.search, {
		raxConfig: {
			retry: 20,
			onRetryAttempt: err => {
				const cfg = rax.getConfig(err);
				console.log(`Retry attempt #${cfg.currentRetryAttempt} for ${location}`);
			}
		},
		params: {
			"auto_ib": false,
			"metadata_only": false,
			"show_groupings": true,
			"supports_for_you_v3": true,
			"timezone_offset": 660,
			"current_tab_id": "home_tab",
			"satori_version": "1.2.5",
			"source": "mc_search_bar",
			"search_type": "search_query",
			"selected_tab_id": "home_tab",
			"is_standard_search": true,
			"version": "1.7.3",
			"items_per_grid": 50,
			"key": config.api.airbnb.key,
			"refinement_paths[]": config.refinement_path,
			"items_offset": skip_amount,
			"adults": search_options.adults,
			"children": search_options.children,
			"infants": search_options.infants,
			"query": location
		}
	})

	// Go through the response data to find apartment listings
	sections = response.data.explore_tabs[0].sections;
	apartments = sections[1];

	return apartments;
}

const getListingIds = async (location, search_options) => {
	// Function loops the request for more listing pages,
	// continuing until there isnt anymore or if
	// all the new ones are repeats

	console.log("Finding listings for", location);
	let id_list = new Set(),
		parsed = 0,
		apartments,
		old_size;

	// As airbnb's list dont show how large it is, we will
	// have to keep requesting for more pages untill 
	// we dont see a change or there isnt a page left
	while (true) {

		// Make a request for a new page
		let apartments = await requestListings(location, search_options, parsed);

		// Check if page data exists in the response
		if (apartments && apartments.listings) {

			// Keep a note of the size before
			// we add the new list
			old_size = id_list.size;

			// Add all the ids from the new list found
			apartments.listings.map( (list) => {
				id_list.add(list.listing.id)
			})

			// As we were supposed to be incrementing by 
			// 50, if airbnb gives us the next page with
			// lots of repeats we will choose to end the
			// search here as more repeats would be likely
			if ((id_list.size - old_size) < 5) {
				break;
			}
			parsed += 50

		}
		else {
			break;
		}
	}

	console.log("Found", id_list.size, "listings for", location)
	return id_list;
}

const allListings = async (locations, search_options) => {
	// Function finds a list of listing ids for the
	// locations and parameters given

	console.log("Searching for airbnb listings that match parameters");

	let total_ids = new Set(),
		promises = [];

	for (let l of locations) {

		// Keep adding promises for each location
		promises.push(getListingIds(l, search_options));

		// When the promises are at max concurrency,
		// or if that promise was the last promise 
		// then wait for all the promises to finish
		if (promises.length == config.maximum_concurrency || l == locations[locations.length - 1]) {
			await Promise.all(promises)
				.then( (data) => {
					data.map( (id_list) => {

						// Merge the current total with the just found id_list
						total_ids = new Set([...total_ids, ...id_list]);
					})
					promises = [];
				});
		}
	}

	console.log("Found total of", total_ids.size, "unique listings");
	return total_ids;
}

export default {
	allListings
}