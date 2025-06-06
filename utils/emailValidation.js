const axios = require('axios');
const dns = require('dns');
const emailExistence = require('email-existence');

async function isDisposableEmail(email) {
    try {
        const response = await axios.get(`https://disposable.debounce.io/?email=${email}`);
        return response.data.disposable === "true";
    } catch (error) {
        console.error("Error checking disposable email:", error);
        return false;
    }
}

function checkEmailDomain(email) {
    return new Promise((resolve) => {
        const domain = email.split("@")[1];
        dns.resolveMx(domain, (err, addresses) => {
            resolve(!err && addresses && addresses.length > 0);
        });
    });
}


module.exports = {
    isDisposableEmail,
    checkEmailDomain,

};