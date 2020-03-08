import readline from "readline";
import { promisify } from "util";
import utils from "./utils.js"
import config from "../config.json"

// Reference: https://gist.github.com/tinovyatkin/4316e302d8419186fe3c6af3f26badff
// Makes readline.question asynchronous
readline.Interface.prototype.question[promisify.custom] = function(prompt) {
	return new Promise(resolve =>
		readline.Interface.prototype.question.call(this, prompt, resolve),
	);
};

readline.Interface.prototype.questionAsync = promisify(
	readline.Interface.prototype.question,
);

// Create read line object for input
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

const askQuestion = async (prompt, check_callback, before_prompt_callback) => {
	// Function builds on top of original readline question
	// function, where an before prompt_callback will be called
	// and when answer is returned will be checked with the 
	// check_callback, if it fails then it will recall askQuestion

	console.clear();

	// Call before_prompt if exist
	if (before_prompt_callback) {
		before_prompt_callback();
	}

	// Prompt user and wait for answer
	let answer = await rl.questionAsync(prompt)
	
	// Return answer if pass check
	if (check_callback(answer)) return answer;
	else {

		// Call askQuestion upon failing check
		console.log("Answer in wrong format, try again in 3s.")
		await utils.sleep(3000);
		return await askQuestion(prompt, check_callback, before_prompt_callback);
	}
}

const yesOrNo = async (prompt, before_prompt_callback) => {
	// Function asks user for a simple yes or no

	let answer = await askQuestion(
		prompt,

		// Check if user input is either "y" or "n"
		(answer) => {
			return (answer.toLowerCase() == "y" || answer.toLowerCase() == "n")
		},
		before_prompt_callback
	)

	// If input is either "y" or "n", then this will
	// return true for "y", false for "n"
	return answer.toLowerCase() == "y"
}

const citiesParameters = async () => {
	// Function asks user for parameters
	// to search for nearby cities

	let city,
		distance,
		correct_parameters;

	city = await askQuestion(
		"What's your central city?: ", 
		(answer) => {

			// Check if answer only consist of letters
			return /^[a-zA-Z]+$/.test(answer.replace(/ /g, ""));
		}
	);

	distance = await askQuestion(
		"How far away from central city is acceptable? (km) : ",
		(answer) => {

			// Check if answer only consist integer
			return parseInt(answer) || answer == "0";
		}
	);

	// Confirm with user whether the input is correct
	correct_parameters = await yesOrNo(
		"Are these parameters? (Y/n) : ",
		() => {
			console.log("You've entered,")
			console.log("City:", city);
			console.log("Distance:", distance);
		}
	);

	// Ask the user again if parameters weren't correct
	if (!correct_parameters) return await citiesParameters()
	else return {
			"city": city,

			// The inputs are strings, thus 
			// integers require conversion
			"distance": parseInt(distance)
		};
}

const simpleListingParameters = async () => {
	// Function asks user for a short list parameters
	// for the searching on airbnb

	let start_date,
		end_date,
		days_staying,
		currency,
		adults,
		children,
		infants,
		correct_parameters;

	start_date = await askQuestion(
		"What is the earliest available date? (year-month-day) (2000-01-01) : ",
		(answer) => {
			return /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(answer);
		}
	)

	end_date = await askQuestion(
		"What is the latest available date? (year-month-day) (2000-01-01) : ",
		(answer) => {
			return /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(answer);
		}
	)

	days_staying = await askQuestion(
		"How many days are you staying between the this time period? : ",
		(answer) => {
			return parseInt(answer) || answer == "0";
		}
	)

	currency = await askQuestion(
		"What currency to use for the search? (AUD, USD, ...) : ",
		(answer) => {
			return Object.keys(config.airbnb_currency).includes(answer);
		},
		() => {
			console.log("Available currencies:")
			for (let curr_abrev in config.airbnb_currency) {
				console.log(`${curr_abrev} - ${config.airbnb_currency[curr_abrev]}`)
			}
		}
	)

	adults = await askQuestion(
		"How many adults are staying? : ",
		(answer) => {
			return parseInt(answer) || answer == "0";
		}
	)

	children = await askQuestion(
		"How many children are staying? : ",
		(answer) => {
			return parseInt(answer) || answer == "0";
		}
	)

	infants = await askQuestion(
		"How many infants are staying? : ",
		(answer) => {
			return parseInt(answer) || answer == "0";
		}
	)

	correct_parameters = await yesOrNo(
		"Are these parameters? (Y/n) : ",
		() => {
			console.log("You've entered,")
			console.log("Earliest date to travel:", start_date)
			console.log("Latest date to travel:", end_date)
			console.log("Days staying:", days_staying)
			console.log("Currency to search in:", currency)
			console.log("Number of adults:", adults);
			console.log("Number of children:", children);
			console.log("Number of infants:", infants);
		}
	);

	if (!correct_parameters) return await simpleListingParameters();
	else return {
			"start_date": start_date,
			"end_date": end_date,
			"days_staying": days_staying,
			"currency": currency,
			"adults": parseInt(adults),
			"children": parseInt(children),
			"infants": parseInt(infants)
		};
}

const savingParameters = async () => {
	let file_name,
		correct_parameters;

	file_name =  await askQuestion(
			"What would you like the saved file name to be?  : ",
			(answer) => {
				return /^[a-zA-Z]+$/.test(answer);
			}
		);

	correct_parameters = await yesOrNo(
		"Is this okay? (Y/n) : ",
		() => {
			console.log(`File will be saved to /saved/${file_name}.txt`);
			console.log("If there's a duplicate, it will replace the file");
		}
	);

	if (!correct_parameters) return await savingParameters();
	else return file_name;
}

export default {
	yesOrNo,
	citiesParameters,
	simpleListingParameters,
	savingParameters
}