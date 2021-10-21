/* Magic Mirror
 * Module: MMM-MQTT
 *
 * By jupadin
 * MIT Licensed.
 */

const Log = require('../../js/logger');
const mqtt = require('mqtt');

const Subscriber = function(url, port, auth, topics) {

    let client = null;

    let onConnectCallback = function () {};
    let onMessageCallback = function () {};
    let onErrorCallback = function () {};
    

    this.connect = function() {
        const options = {
            port: port,
        };

        if (auth) {
            options.user = auth.user;
            options.password = auth.password;
        }

        // Connect to broker.
        client = mqtt.connect(url, options);
        // Subscribe to topics.
        client.subscribe(topics);

        // Callback functions
        client.on("connect", onConnectCallback);
        client.on("message", onMessageCallback);
        client.on("error", onErrorCallback);
    };

    this.onConnect = function(callback) {
        onConnectCallback = callback;
    }

    this.onMessage = function(callback) {
        onMessageCallback = callback;
    }

    this.onError = function(callback) {
        onErrorCallback = callback;
    }

    /**
     * Returns the url of this subscriber.
     * 
     * @returns {string} The url of this subscriber.
     */
    this.url = function() {
        return url;
    };

    /**
     * Returns the client of this subscriber.
     * 
     * @returns The client of this subscriber.
     */
    this.client = function() {
        return client;
    }

    /**
     * Returns the topics this subscriber is subscribed to.
     * 
     * @returns The topics this subscriber is subscribed to.
     */
    this.topics = function() {
        return topics;
    }
};

module.exports = Subscriber;