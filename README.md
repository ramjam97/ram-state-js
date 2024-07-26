# RamState
RamState is a lightweight state management library designed specifically for vanilla JavaScript. It provides a simple and efficient way to manage and update state without the need for additional frameworks. It supports both direct and functional updates, offers easy state retrieval, and allows side effects to be triggered on state changes.


## Features

- Setters: Update state directly or using a function.
- Getters: Retrieve the current state using a method or a property.
- Side Effects: Execute functions whenever the state changes.


## Usage/Examples
#### Instance
Create a new state instance with an initial value.

```javascript
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
Execute a function whenever the state changes.
```javascript
rCounter.watch((newData, oldData) => {
    // Execute side effects here
    console.log(`Counter changed from ${oldData} to ${newData}`);
});
```

### How to Add RamState to Your Project
To add RamState to your project, you can simply download the ramstate.js file from the repository and include it in your project.

1. Download ramstate.js: 
Download the file from the repository and place it in your project directory.

2. Include RamState in Your Project:
Add the following script tag to your HTML file or import it into your JavaScript file.

```html
<script src="path/to/ram-state.min.js"></script>
```
or
```javascript
import RamState from './path/to/ram-state.min.js';
```
## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.