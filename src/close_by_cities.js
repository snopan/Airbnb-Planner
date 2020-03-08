import axios from "axios";
import * as rax from "retry-axios";
import config from "../config.json"

// Used for retrying axios
const interceptorId = rax.attach();

const getCloseBy = async (options) => {
	// Function requests to an API with centeral 
	// city and radius for close by cities 

	let output = [],
		response;

	// Make a request to API
	response = await axios.get(config.api.geobytes.address+config.api.geobytes.near_by_cities, {
		
		// Retry with exponential timeouts
		raxConfig: {
			retry: 20,
			onRetryAttempt: err => {
				const cfg = rax.getConfig(err);
				console.log(`Retry attempt #${cfg.currentRetryAttempt}`);
			}
		},
    	params: {
    		"radius": options.distance,
    		"locationcode": options.city
    	}
	})
    
	response.data.map( (city) => {
		output.push(city[1]);
	});

    return output;
}

export default {
	getCloseBy
}