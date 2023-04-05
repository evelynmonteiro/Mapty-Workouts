"use strict";

const form = document.querySelector(".form");
const formCloseBtn = document.querySelector(".form__button--close");
const formTitle = document.querySelector(".form__title")
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

const openBtn = document.querySelector(".open__btn");
const closeBtn = document.querySelector(".close__btn");
const sidebar = document.querySelector(".sidebar");

class Workout {

  constructor(coords, distance, duration, id, date) {
    this.id = id || (Date.now() + "").slice(-10);
    this.date = date ? new Date(date) : new Date();
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence, id, date) {
    super(coords, distance, duration, id, date);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain, id, date) {
    super(coords, distance, duration, id, date);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  _map;
  _mapZoomLevel = 13;
  _mapEvent;
  _workouts = [];
  _editMode = false;
  _editWorkoutObj;
  _editWorkoutEl;

  constructor() {
    this._getPosition();

    this._getLocalStorage();

    form.addEventListener("submit", this._handleFormSubmit.bind(this));
    formCloseBtn.addEventListener("click", this._hideForm.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._handleContainerClick.bind(this));

    openBtn.addEventListener("click", this._openSidebar);
    closeBtn.addEventListener("click", this._closeSidebar);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    const coords = [latitude, longitude];

    this._map = L.map("map").setView(coords, this._mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.fr/hot/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    this._map.on("click", this._showForm.bind(this));

    this._workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    console.log(this._editMode)
    if(mapE != null) this._mapEvent = mapE;
    formTitle.innerText = 'Add your workout'
    form.classList.remove("form--hidden");
    inputDistance.focus();
    this._openSidebar();
  }

  _hideForm() {
    this._editMode = false
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    /* form.style.display = "none"; */
    form.classList.add("form--hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e, edit) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const lat = edit ? undefined : this._mapEvent.latlng.lat;
    const lng = edit ? undefined : this._mapEvent.latlng.lng;
    let workout;

    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Input have to be positive number");

      workout = edit ? new Running(this._editWorkoutObj.coords, distance, duration, cadence, this._editWorkoutObj.id, this._editWorkoutObj.date) : new Running([lat, lng], distance, duration, cadence);
    }

    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration, elevation)
      )
        return alert("Input have to be positive number");

      workout = edit ? new Cycling(this._editWorkoutObj.coords, distance, duration, elevation, this._editWorkoutObj.id, this._editWorkoutObj.date) : new Cycling([lat, lng], distance, duration, elevation);
    }

    if(edit){
      const workoutEditIndex = this._workouts.findIndex((work) => work.id === this._editWorkoutObj.id)

      this._workouts.splice(workoutEditIndex, 1, workout);

      this._map.eachLayer(function(layer){
        if(layer instanceof L.Marker && layer.options.workoutID == workout.id){
          layer.remove()
        }
      })
      
      this._editWorkoutEl.remove();

    } else {

      this._workouts.push(workout);

    }

    this._renderWorkout(workout);

    this._renderWorkoutMarker(workout);

    this._hideForm();

    this._setLocalStorage(); 
  }

  _deteleWorkout(e){
    const del = confirm("Are you sure you want to delete this workout?")
    
    if(del){
      const workoutEl = e.target.closest(".workout")
      const workoutDelIndex = this._workouts.findIndex((work) => work.id === workoutEl.dataset.id)

      this._workouts.splice(workoutDelIndex, 1)

      this._setLocalStorage()

      workoutEl.remove()

      this._map.eachLayer(function(layer){
        if(layer instanceof L.Marker && layer.options.workoutID == workoutEl.dataset.id){
          layer.remove()
        }
      })
    }
  }

  _editWorkoutForm(e){
    this._editMode = true;
    this._showForm()
    
    // show worktout informations on form
    formTitle.innerText = "Edit your workout"

    this._editWorkoutEl = e.target.closest(".workout")
    this._editWorkoutObj = this._workouts.find((work) => work.id === this._editWorkoutEl.dataset.id)
    
    inputType.value = this._editWorkoutObj.type
    inputDuration.value = this._editWorkoutObj.duration
    inputDistance.value = this._editWorkoutObj.distance
    
    if (this._editWorkoutObj.type == "cycling"){
      inputElevation.closest(".form__row").classList.remove("form__row--hidden");
      inputCadence.closest(".form__row").classList.add("form__row--hidden");
      inputElevation.value = this._editWorkoutObj.elevationGain
    } else {
      inputCadence.closest(".form__row").classList.remove("form__row--hidden");
      inputElevation.closest(".form__row").classList.add("form__row--hidden")
      inputCadence.value = this._editWorkoutObj.cadence
    }
  }

  _handleFormSubmit(e){
    if(this._editMode == true){
      this._newWorkout(e, true)
    } else {
      this._newWorkout(e)
    }
  }

  _handleContainerClick(e){
    const closeBtn = e.target.closest(".workout__button--close")
    const editBtn = e.target.closest(".workout__button--edit")
    
    if(closeBtn){
      this._deteleWorkout(e)
      return;
    }

    if(editBtn){
      this._editWorkoutForm(e)
      return;
    }

    this._moveToPopup(e)
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords, {workoutID: workout.id})
      .addTo(this._map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃🏻" : "🚲"} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <div class="workout__header">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__buttons">
          <button class="workout__button workout__button--edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="workout__button workout__button--close">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === "running" ? "🏃🏻" : "🚲"
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === "running")
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;

    if (workout.type === "cycling")
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🔺</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>`;

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) return;

    this._closeSidebar();

    const workout = this._workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this._map.setView(workout.coords, this._mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this._workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;

    const dataObjects = data.map(workout => {
      if(workout.type == "running"){
        return new Running(workout.coords, workout.distance, workout.duration, workout.cadence, workout.id, workout.date)
      } else {
        return new Cycling(workout.coords, workout.distance, workout.duration, workout.elevationGain, workout.id, workout.date);
      }
    })

    this._workouts = dataObjects;
    this._workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem("workouts");
  }

  _openSidebar() {
    sidebar.classList.add("open");
    document
      .querySelector(".leaflet-control-container")
      .classList.add("hidden");
    openBtn.classList.add("hidden");
  }

  _closeSidebar() {
    sidebar.classList.remove("open");
    setTimeout(() => {
      document
        .querySelector(".leaflet-control-container")
        .classList.remove("hidden");
      openBtn.classList.remove("hidden");
    }, 500);
  }
}

const app = new App();