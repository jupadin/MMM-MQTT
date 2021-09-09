/* Magic Mirror
 * Module: MMM-MQTT
 *
 * By Julian Dinter
 * MIT Licensed.
 */

Module.register("MMM-MQTT", {
    // Default module config.
    defaults: {
        header: "MMM-MQTT",
        animationSpeed: 2 * 1000, // 2 seconds
    },

    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);
        const self = this;
        this.loaded = false;
        this.fetchedData = [];

        this.config.mqttBrokers.forEach((mqttBroker) => {
            const broker = {};
            // broker.url = broker.url.replace("http://", "mqtt://");
            broker.url = (mqttBroker.url.match(/^mqtts?:\/\//) ? "" : "mqtt://") + mqttBroker.url;
            broker.port = mqttBroker.port;
            broker.auth = mqttBroker.auth;
            broker.topics = [];
            broker.topics.push(
                ...mqttBroker.subscriptions
                .map((sub) => sub.topic)
                .filter((topic) => !broker.topics.includes(topic))
            );

            // Create initialized objects for each topic of each subscription the broker.
            mqttBroker.subscriptions.map((subscription) => {
                this.fetchedData.push({
                    broker: broker.url,
                    topic: subscription.topic,
                    label: subscription.label || "",
                    suffix: subscription.suffix || "",
                    value: null,
                    numberOfDecimals: subscription.numDecimals || 0,
                    time: Date.now(),
                    colors: subscription.colors || false,
                    showLabelAsIcon: subscription.showLabelAsIcon || false,
                    icon: subscription.icon || "",
                    conversion: subscription.conversion || false,
                    position: subscription.position || 0,
                    offset: subscription.offset || false,
                    factor: subscription.factor || false,
                    decimalSign: subscription.decimalSign || false,
                    average: false,
                    pastValues: [],
                })
            });

            this.addBroker(broker.url, broker.port, broker.auth, broker.topics);
        });

        // Change from "LOADING" to "NO_MESSAGE", if no message has been received yet.
        setTimeout(function() { self.loaded = true; self.updateDom(self.config.animationSpeed); }, this.config.animationSpeed);
    },

    // Define required styles.
    getStyles: function() {
        return ["MMM-MQTT.css", "font-awesome.css"];
    },

    // Define required scripts.
    getScripts: function() {
        return [];
    },

    // Define header.
    getHeader: function() {
        return this.config.header;
    },

    // Override dom generator.
    getDom: function() {
        const wrapper = document.createElement("table");
        wrapper.className = "wrapper";
        wrapper.id = "wrapper";

        if (!this.loaded) {
            wrapper.innerHTML = this.translate("LOADING");
            wrapper.className = "light small dimmed";
            return wrapper;
        }

        // If no subscriptions were defined in the config file
        if (this.fetchedData.length === 0) {
            wrapper.innerHTML = this.translate("EMPTY");
            wrapper.className = "light small dimmed";
            return wrapper;
        }

        // If no value has been received yet
        if (this.fetchedData.every(element => element.value === null)) {
            wrapper.innerHTML = this.translate("NO_MESSAGE");
            wrapper.className = "light small dimmed";
            return wrapper;
        }

        // Sort fetched data based on their position value
        this.fetchedData.sort((a, b) => {
            return a.position - b.position;
        });

        this.fetchedData.forEach((subscription) => {
            // If there is a topic for which no value is currently received since the start of the mirror,
            if (subscription.value === null) {
                // skip this entry.
                return;
            }

            // TODO: First convert values and then check coloring, since
            // currently coloring is based on initial values.

            // Subscription wrapper
            const subscriptionWrapper = document.createElement("tr");
            subscriptionWrapper.className = "subscription";

            // Colors
            const colors = this.getColors(subscription);

            // Label
            const labelWrapper = document.createElement("td");
            labelWrapper.className = "label";
            labelWrapper.style.color = colors.label;

            if (subscription.showLabelAsIcon && subscription.icon !== "") {
                const iconWrapper = document.createElement("i");
                iconWrapper.classList.add("fa", "fa-fw", "fa-" + subscription.icon);
                labelWrapper.appendChild(iconWrapper);
            } else {
                labelWrapper.classList.add("align-left");
                labelWrapper.innerHTML = subscription.label;
            }
            
            subscriptionWrapper.appendChild(labelWrapper);

            // Value
            const valueWrapper = document.createElement("td");
            valueWrapper.className = "value align-right bright";
            valueWrapper.style.color = colors.value;
            const convertedValue = this.convertValue(subscription);
            valueWrapper.innerHTML = convertedValue;
            subscriptionWrapper.appendChild(valueWrapper);

            // Suffix
            const suffixWrapper = document.createElement("td");
            suffixWrapper.className = "suffix align-left";
            suffixWrapper.style.color = colors.suffix;
            suffixWrapper.innerHTML = subscription.suffix;
            subscriptionWrapper.appendChild(suffixWrapper);

            wrapper.appendChild(subscriptionWrapper);
        });

        // Return the wrapper to the dom.
        return wrapper;
    },

    // Override socket notification handler.
    socketNotificationReceived: function(notification, payload) {
        if (notification == "DATA") {
            const animationSpeed = this.loaded ? 0 : this.config.animationSpeed;
            // Update data set with received data
            this.updateData(payload);
            // Update dom with given animation speed.
            this.updateDom(animationSpeed);
        } else if (notification == "ERROR") {
            // TODO: Update front-end to display specific error.
        }
    },

    /**
     * Requests the node helper to add the broker at the given url.
     * 
     * @param {string} url The broker url
     * @param {bumber} port The port to access the broker
     * @param {object} auth The authentication credentials
     * @param {object} topics The topics of this broker
     */
    addBroker: function(url, port, auth, topics) {
        this.sendSocketNotification("ADD_BROKER", {
            id: this.identifier,
            url: url,
            port: port,
            auth: auth,
            topics: topics
        });
    },

    updateData: function(receivedData) {
        for (let i = 0; i < this.fetchedData.length; i++) {
            let savedData = this.fetchedData[i];
            // if (!(receivedData.url === savedData.url) || !(this.matchTopics(receivedData.topic, savedData.topic))) {
            if (!(receivedData.url === savedData.url) || !(receivedData.topic === savedData.topic)) {
                continue;
            }
            // We found our entry
            this.fetchedData[i].value = receivedData.payload;
            break;
        }
    },

    // matchTopics: function(topicA, topicB) {
    //     const regTemp = /^\+$|^\+(?=\/)|(?<=\/)\+(?=\/)|(?<=\/)\+(?=$)/g;
    //     const reg = new RegExp("^", + topicA.replace(regTemp, "[^/]+") + "$");
    //     const match = topicB.match(reg);
    //     return match ? match.length == 1 : false;
    // }

    /**
     * 
     * @param {} subscription 
     * @returns The color definition of label, value and suffix.
     */
    getColors: function(subscription) {
        if (!subscription.colors || subscription.colors.length == 0) {
            return {};
        }

        let colors;
        for (let i = 0; i < subscription.colors.length; i++) {
            // Iterate over each color definiton
            colors = subscription.colors[i];
            // If the next "upTo"-Value is greater than the current value, break the loop, use the previous next color definition
            if (subscription.value < colors.upTo) {
                break;
            }
        }

        // and return it.
        return colors;    
    },

    /**
     * Function to apply user defined conversions
     * 
     * @param {object} subscription The current subscription
     * @returns {object} The converted value as object (?)
     */
    convertValue: function(subscription) {
        let subscriptionValue = subscription.value;
        Log.debug("Converting value from: " + subscriptionValue);

        // If conversion should be done
        if (subscription.conversion) {
            // Iterate over all conversions
            for (let i = 0; i < subscription.conversion.length; i++) {
                // If the current value is equal to a conversion value,
                if (subscription.value.trim() == subscription.conversion[i].from.trim()) {
                    Log.debug("to: " + subscription.conversion[i].to);
                    // set the current value to its subscription value.
                    subscriptionValue = subscription.conversion[i].to;
                }
            }
        }

        if (subscription.factor) {
            Log.debug("with a factor of: " + subscription.factor);
            subscriptionValue *= subscription.factor;
        }

        if (subscription.offset) {
            Log.debug("with an offset of: " + subscription.offset);
            subscriptionValue += subscription.offset;
        }

        //TODO: Add decimal or thousand divider
        Log.debug("to its final value: " + subscriptionValue);
        return subscriptionValue;
    }
});