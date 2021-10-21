# MMM-MQTT

<p style="text-align: center">
    <a href="https://choosealicense.com/licenses/mit"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

This module is an extention for the [MagicMirror](https://github.com/MichMich/MagicMirror).

The module is based on the work of [ottopaulsen](https://github.com/ottopaulsen/MMM-MQTT) but has a cleaner interface, refactored code, other configuration options and is actively maintained.

The module shows the payload of a message reiceived via MQTT.

### To-Do's
- Implement wildcards
- Implement average value

## Installation

Open a terminal session, navigate to your MagicMirror's `modules` folder and execute `git clone https://github.com/jupadin/MMM-MQTT.git`, such that a new folder called `MMM-MQTT` will be created.

Navigate inside the folder and execute `npm install` to install all dependencies.

```
cd modules
git clone https://github.com/jupadin/MMM-MQTT.git
cd MMM-MQTT
npm install
```

Activate the module by adding it to the `config.js` file of the MagicMirror as shown below.

## Using the module
````javascript
    modules: [
        {
            module: 'MMM-MQTT',
            header: 'MMM-MQTT',
            position: 'top_right',
            config: {
                mqttBroker: [
                    {
                        url: "localhost",
                        port: 1883,
                        auth: {
                            user: "user",
                            password: "password",
                        },
                        subscriptions: [
                            {
                                topic: "home/living-room/temperature", // Topic to look for
                                label: "Temperature", // Label, which is displayed in front of the value
                                showLabelAsIcon: true, // Specify whether the label shall be replaced by the specified icon
                                icon: "thermometer", // Font awesome icon, which shall be displayed (only if showLabelAsIcon option is set to true)
                                suffix: "°C", // Suffix, which is displayed behind the value
                                decimals: 1, // Round value to this number of decimals
                                position: 2, // Position of the value inside the table (counting top to bottom)
                                colors: [
                                    {upTo: 0, label: "#0a3fb0", value: "#0000FF", suffix: "#FFFFF"},
                                    {upTo: 25, value: "#00FF00"},
                                    {upTo: 35, value: "#FF0000"},
                                ],
                                factor: 4, // Factor with which the value should be factorized by
                                offset: 5, // Offset of the value
                            },
                            {
                                topic: "home/living-room/light", // Topic to look for
                                label: "Lumen", // Label, which is displayed in front of the value
                                showLabelAsIcon: true, // Specify whether the label shall be replaced by the specified icon
                                icon: "lightbulb", // Font awesome icon, which shall be displayed (only if showLabelAsIcon option is set to true)
                                suffix: "lm", // Suffix, which is displayed behind the value
                                decimals: 2, // Round value to this number of decimals
                                position: 1, // Position of the value inside the table (counting top to bottom)
                                colors: [
                                    {upTo: 0, label: "#0a3fb0", value: "#0000FF", suffix: "#FFFFF"},
                                    {upTo: 100, value: "#00FF00"},
                                ],
                            },
                            {
                                topic: "home/living-room/lightswitch", // Topic to look for
                                label: "Switch", // Label, which is displayed in front of the value
                                conversion: [
                                    {from: "true", to: "On"},
                                    {from: "false", to: "Off"},
                                ],
                            }
                        ]
                    }
                ]
            }
        }
    ]
````

## Configuration options

The mqttBroker is an array, such that multiple brokers can be added to it.
The module can also be used multiple times in the mirror.

## Wildcards (Will be implemented soon)
The wildcard `+` and `#` are currently not supported, since it only works on some platforms (Chrome, Electron).

## Conversions
Use the conversions array to convert values from one (in)to another. If there is no match, the received value is used.

For numeric values, the factorization and offset should be (! - see To-Do's) applied before they are converted.

Conversions can also be used to display icons:
```javascript
conversions: [
    {
        from: "on",
        to: "<i class='far fa-thumbs-up' style='color:green;'></i>"
    },
    {
        from: "off",
        to: "<i class='far fa-thumbs-down' style='color:red;'></i>"
```

## Coloring
For numberic values, the color of either the label, value, suffix or all of them can be changed, based on the color array of the specific topic.
Color scheme can also be defined in the config file as constant, like
```javascript
const tempColors = [
    {upTo: 0, value: "#0000FF"},
    {upTo: 10, value: "#00FF00"},
    {upTo: 35, value: "#FF0000"},
]
```
and then referring to it with
```javascript
colors: tempColors
```

## References
As already said, the module is mainly based on the work of [ottopaulsen](https://github.com/ottopaulsen/MMM-MQTT) with some modifications, optimizations and refactored code.

There are also some concepts taken from the default calendar module of the [MagicMirror](https://github.com/MichMich/MagicMirror).