# RamStateJs
RamStateJs is a lightweight state management library designed specifically for vanilla JavaScript. It provides a simple and efficient way to manage and update state without the need for additional frameworks. It supports both direct and functional updates, offers easy state retrieval, allows side effects to be triggered on state changes, and includes version tracking.


## Features

- **Setters:** Update state directly or using a function.
- **Getters:** Retrieve the current state using a method or a property.
- **Side Effects:** Execute functions whenever the state changes.
- **Version Tracking:** Track the version of the state with each update.


## Usage/Examples
#### Instance
Create a new state instance with an initial value.

```javascript
const rArray = new RamState([]);
const rObject = new RamState({});
const rBoolean = new RamState(true);
...
const rCounter = new RamState(0);
```

#### Setters
Update the state directly or using a function.
```javascript
rCounter.set(5);                 // Direct update
rCounter.set(val => val + 5);    // Functional update
```

#### Getters
Retrieve the current state.
```javascript
console.log(rCounter.get());    // Using method
console.log(rCounter.value);    // Using property
```

#### Side Effects
Execute a function whenever the state changes, with an option to execute immediately upon initializing.
```javascript
// With the second parameter
// The second parameter `true` will execute the callback immediately
rCounter.watch((newData, oldData, version) => {
    console.log(`Data changed from ${oldData} to ${newData}`);
    console.log(`version: ${version}`);
}, true); 

// Without the second parameter
// This will only execute the callback on subsequent state changes
rCounter.watch((newData, oldData, version) => {
    console.log(`Data changed from ${oldData} to ${newData}`);
    console.log(`version: ${version}`);
});

// Update the state
rCounter.set(5);  // Logs: "Counter changed from 0 to 5, version: 1"
rCounter.set(val => val + 5);  // Logs: "Counter changed from 5 to 10, version: 2"
```

## Installation
#### How to Add RamStateJs to Your Project
To add RamStateJs to your project, you can simply download the ram-state.min.js file from the repository and include it in your project.

1. Download ram-state.min.js: 
Download the file from the repository and place it in your project directory.

2. Include RamStateJs in Your Project:
Add the following script tag to your HTML file.

```html
<script src="path/to/ram-state.min.js"></script>
```

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.