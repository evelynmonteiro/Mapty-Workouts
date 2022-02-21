const openBtn = document.querySelector(".open__btn");
const closeBtn = document.querySelector(".close__btn");
const sidebar = document.querySelector(".sidebar");

const openSidebar = function () {
  sidebar.classList.add("open");
  document.querySelector(".leaflet-control-container").classList.add("hidden");
  openBtn.classList.add("hidden");
};

const closeSidebar = function () {
  sidebar.classList.remove("open");
  setTimeout(() => {
    document
      .querySelector(".leaflet-control-container")
      .classList.remove("hidden");
    openBtn.classList.remove("hidden");
  }, 500);
};

openBtn.addEventListener("click", openSidebar);

closeBtn.addEventListener("click", closeSidebar);
