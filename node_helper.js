/* Magic Mirror
 * Module: MMM-MQTT
 *
 * By Julian Dinter
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const Log = require('../../js/logger.js');

const Subscriber = require('./subscriber.js');

module.exports = NodeHelper.create({
    // Override start method.
    start: function() {
        // Log.log("Starting node helper for: " + this.name);
        this.subscribers = {};
    },

    // Override socketNotificationReveived method.
    socketNotificationReceived: function(notification, payload) {
        if (notification == "ADD_BROKER") {
            this.createSubscriber(payload.url, payload.port, payload.auth, payload.topics, payload.id);
        }
    },

    /**
     * Creates a subscriber for a new url, it it does not exist yet.
     * Otherwise it reuses the existing one.
     * 
     * @param {string} url The url of the broker
     * @param {number} port The port of the broker
     * @param {object} auth The object containing options for authentication against the broker
     * @param {array} topics An array of topics to which the subscriber should subscribe to
     * @param {string} identifier ID of the module
     */
    createSubscriber: function(url, port, auth, topics, identifier) {
        try {
            new URL(url);
        } catch (error) {
            Log.error(this.name + ": MQTT Error. Malformed broker url: ", url, error);
            this.sendSocketNotification("MQTT_ERROR", { error_type: "MODULE_ERROR_MALFORMED_URL" });
            return;
        }

        let subscriber;
        if (typeof this.subscribers[identifier + url] === "undefined") {
            Log.log(this.name + ": Create new subscriber for url: " + url + " and topic(s): " + topics);
            subscriber = new Subscriber(url, port, auth, topics);

            // Set callback functions
            subscriber.onConnect((packet) => {
                Log.debug(this.name + ": Connected! (" + url + ", " + topics + ").");
            });

            subscriber.onMessage((topic, payload, packet) => {
                Log.log(this.name + ": Receivied message. Topic: \"" + topic + "\", with payload: \"" + payload.toString() + "\"");
                this.sendSocketNotification("DATA", {topic: topic, payload: payload.toString()});
            });

            subscriber.onError((error) => {
                Log.debug(this.name + ": Error: " + error);

            });

            // Connect to server and subscribe to topics.
            subscriber.connect();

            this.subscribers[identifier + url] = subscriber;
        } else {
            Log.log(this.name + ": Use existing subscriber for url: " + url);
            subscriber = this.subscribers[identifier + url];
        }
    },
});