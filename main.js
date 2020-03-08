import CloseCities from "./src/close_by_cities.js";
import Listings from "./src/listings.js";
import Timetables from "./src/timetables.js";
import Pricing from "./src/pricing.js"
import Writing from "./src/writing.js"
import Cli from "./src/cli.js"
import config from "./config.json"

const getCloseCities = async () => {
	// Function finds a list of cities that are in
	// range of the central city that user has chose
	// cities are returned as a list

	let parameters, cities, correct_cities;

	parameters = await Cli.citiesParameters();
	cities = await CloseCities.getCloseBy(parameters);

	correct_cities = await Cli.yesOrNo(
		"Are these cities okay? (Y/n): ",
		() => {
			console.log("Cities to search:");
			cities.map( (c) => {
				console.log(c);
			});
		}
	);
	if (!correct_cities) return await getCloseCities();
	else return cities;
}

const getTimetablePrices = async (cities) => {
	// Function finds listings and their timetables
	// then parses all the timetables to find prices
	// on the available timetables, and returns 
	// priced_timetables as a list

	let simple_parameters,
		parameters, 
		listings, 
		timetables,
		priced_timetables;

	// NOT IMPLEMENTED YET
	// simple_parameters = await Cli.yesOrNo("Would you like simple parameters for searching Airbnb? (Y/n): ")
	// if (simple_parameters) parameters = await Cli.simpleListingParameters();

	parameters = await Cli.simpleListingParameters();
	listings = await Listings.allListings(cities, parameters);
	timetables = await Timetables.allTimetables(listings, parameters);
	priced_timetables = await Pricing.getPricing(timetables, parameters);

	return priced_timetables;
}

const saveTimetablePrices = async (timetable_prices) => {
	let file_name = await Cli.savingParameters();

	await Writing.savePrices(timetable_prices, file_name);
}

const startSearch = async () => {
	let cities, timetable_prices;

	cities = await getCloseCities();

	timetable_prices = await getTimetablePrices(cities);

	await saveTimetablePrices(timetable_prices);
}

(async () => {
	await startSearch();
})();
