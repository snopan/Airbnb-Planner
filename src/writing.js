import fs from "fs";
import { promisify } from "util";

// Define async versions of fs functions
const unlinkFileAsync = promisify(fs.unlink);
const appendFileAsync = promisify(fs.appendFile);

const savePrices = async (timetable_prices, file_name) => {
	// Function writes the timetable prices to a file

	console.log("Attempting to save results")

	// Remove file if it exist
	await unlinkFileAsync(`${file_name}.txt`).catch((err) => {});

	// Then start writing the new file
	for (let timetable of timetable_prices) {
		await appendFileAsync(
			`${file_name}.txt`, 
			"id: "+timetable.id+"\n"+
			"price: "+timetable.price+"\n"+
			"available days:\n"
		);

		// Every day will be written in a new line
		for (let day of timetable.days) {
			await appendFileAsync(`${file_name}.txt`, `    ${day}\n`)
		}

		await appendFileAsync(`${file_name}.txt`, "\n"	)
	}

	console.log("Finished writing to file")
}



export default {
	savePrices
}