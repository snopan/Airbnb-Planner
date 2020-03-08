const getStartAndInterval = (start_date, end_date) => {
	let start_arr = start_date.split("-"),
		end_arr = end_date.split("-");

	let start_year = parseInt(start_arr[0]),
		start_month = parseInt(start_arr[1]),
		months_in_between = 
			parseInt(end_arr[0] - start_arr[0]) * 12 +
			parseInt(end_arr[1] - start_arr[1]) + 1;

	return [start_month, start_year, months_in_between];
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
	getStartAndInterval,
	sleep
}