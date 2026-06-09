import "jsvectormap/dist/jsvectormap.min.css";
import "flatpickr/dist/flatpickr.min.css";
import "dropzone/dist/dropzone.css";
import "../css/style.css";

import Alpine from "alpinejs";
import persist from "@alpinejs/persist";
import flatpickr from "flatpickr";
import Dropzone from "dropzone";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import chart01 from "./components/charts/chart-01";
import chart02 from "./components/charts/chart-02";
import chart03 from "./components/charts/chart-03";
import map01 from "./components/map-01";
import "./components/image-resize";

Alpine.plugin(persist);
window.Alpine = Alpine;

window.tailAdminPageInit = (scope) => {
  const stored = localStorage.getItem("darkMode");
  scope.darkMode = stored === null ? false : JSON.parse(stored);
  scope.$watch("darkMode", (value) =>
    localStorage.setItem("darkMode", JSON.stringify(value)),
  );
  setTimeout(() => {
    scope.loaded = false;
  }, 500);
};

window.dropdown = function dropdown() {
  return {
    options: [],
    selected: [],
    show: false,
    open() {
      this.show = true;
    },
    close() {
      this.show = false;
    },
    isOpen() {
      return this.show === true;
    },
    select(index, event) {
      if (!this.options[index].selected) {
        this.options[index].selected = true;
        this.options[index].element = event.target;
        this.selected.push(index);
      } else {
        this.selected.splice(this.selected.lastIndexOf(index), 1);
        this.options[index].selected = false;
      }
    },
    remove(index, option) {
      this.options[option].selected = false;
      this.selected.splice(index, 1);
    },
    loadOptions() {
      const select = document.getElementById("select");
      if (!select) return;

      const options = select.options;
      for (let i = 0; i < options.length; i += 1) {
        this.options.push({
          value: options[i].value,
          text: options[i].innerText,
          selected:
            options[i].getAttribute("selected") != null
              ? options[i].getAttribute("selected")
              : false,
        });
      }
    },
    selectedValues() {
      return this.selected.map((option) => this.options[option].value);
    },
  };
};

function initFlatpickr() {
  flatpickr(".datepicker", {
    mode: "range",
    static: true,
    monthSelectorType: "static",
    dateFormat: "M j",
    defaultDate: [new Date().setDate(new Date().getDate() - 6), new Date()],
    prevArrow:
      '<svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.25 6L9 12.25L15.25 18.5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    nextArrow:
      '<svg class="stroke-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.75 19L15 12.75L8.75 6.5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    onReady: (selectedDates, dateStr, instance) => {
      instance.element.value = dateStr.replace("to", "-");
      const customClass = instance.element.getAttribute("data-class");
      if (customClass) {
        instance.calendarContainer.classList.add(customClass);
      }
    },
    onChange: (selectedDates, dateStr, instance) => {
      instance.element.value = dateStr.replace("to", "-");
    },
  });
}

function initDropzone() {
  const upload = document.querySelector("#demo-upload");
  if (upload && !upload.dropzone) {
    new Dropzone("#demo-upload", { url: "/file/post" });
  }
}

function initCalendar() {
  const calendarEl = document.querySelector("#calendar");
  if (!calendarEl || calendarEl.dataset.tailadminCalendar === "ready") return;

  calendarEl.dataset.tailadminCalendar = "ready";
  const newDate = new Date();
  const getDynamicMonth = () => {
    const month = newDate.getMonth() + 1;
    return month < 10 ? `0${month}` : `${month}`;
  };

  const calendarEventsList = [
    { id: 1, title: "Event Conf.", start: `${newDate.getFullYear()}-${getDynamicMonth()}-01`, extendedProps: { calendar: "Danger" } },
    { id: 2, title: "Seminar #4", start: `${newDate.getFullYear()}-${getDynamicMonth()}-07`, end: `${newDate.getFullYear()}-${getDynamicMonth()}-10`, extendedProps: { calendar: "Success" } },
    { groupId: "999", id: 3, title: "Meeting #5", start: `${newDate.getFullYear()}-${getDynamicMonth()}-09T16:00:00`, extendedProps: { calendar: "Primary" } },
    { groupId: "999", id: 4, title: "Submission #1", start: `${newDate.getFullYear()}-${getDynamicMonth()}-16T16:00:00`, extendedProps: { calendar: "Warning" } },
    { id: 5, title: "Seminar #6", start: `${newDate.getFullYear()}-${getDynamicMonth()}-11`, end: `${newDate.getFullYear()}-${getDynamicMonth()}-13`, extendedProps: { calendar: "Danger" } },
    { id: 6, title: "Meeting 3", start: `${newDate.getFullYear()}-${getDynamicMonth()}-12T10:30:00`, end: `${newDate.getFullYear()}-${getDynamicMonth()}-12T12:30:00`, extendedProps: { calendar: "Success" } },
    { id: 7, title: "Meetup #", start: `${newDate.getFullYear()}-${getDynamicMonth()}-12T12:00:00`, extendedProps: { calendar: "Primary" } },
    { id: 8, title: "Submission", start: `${newDate.getFullYear()}-${getDynamicMonth()}-12T14:30:00`, extendedProps: { calendar: "Warning" } },
    { id: 9, title: "Attend event", start: `${newDate.getFullYear()}-${getDynamicMonth()}-13T07:00:00`, extendedProps: { calendar: "Success" } },
    { id: 10, title: "Project submission #2", start: `${newDate.getFullYear()}-${getDynamicMonth()}-28`, extendedProps: { calendar: "Primary" } },
  ];

  const modal = document.getElementById("eventModal");
  const titleEl = document.querySelector("#event-title");
  const startDateEl = document.querySelector("#event-start-date");
  const endDateEl = document.querySelector("#event-end-date");
  const addBtn = document.querySelector(".btn-add-event");
  const updateBtn = document.querySelector(".btn-update-event");

  const closeModal = () => {
    if (modal) modal.style.display = "none";
    if (titleEl) titleEl.value = "";
    if (startDateEl) startDateEl.value = "";
    if (endDateEl) endDateEl.value = "";
  };

  document.querySelectorAll("[data-bs-dismiss='modal']").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, listPlugin, timeGridPlugin, interactionPlugin],
    initialView: "dayGridMonth",
    headerToolbar: {
      left: "prev,next addEventButton",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    events: calendarEventsList,
    selectable: true,
    customButtons: {
      addEventButton: {
        text: "Add Event +",
        click() {
          if (addBtn) addBtn.style.display = "flex";
          if (updateBtn) updateBtn.style.display = "none";
          if (modal) modal.style.display = "flex";
        },
      },
    },
    eventClick(info) {
      if (titleEl) titleEl.value = info.event.title;
      if (startDateEl) startDateEl.value = info.event.startStr;
      if (endDateEl) endDateEl.value = info.event.endStr;
      if (addBtn) addBtn.style.display = "none";
      if (updateBtn) updateBtn.style.display = "flex";
      if (modal) modal.style.display = "flex";
    },
  });

  calendar.render();
}

function initSearchShortcut() {
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  if (!searchInput || !searchButton || searchButton.dataset.tailadminSearch === "ready") return;

  searchButton.dataset.tailadminSearch = "ready";
  searchButton.addEventListener("click", () => searchInput.focus());
}

function initCopyButton() {
  const copyButton = document.getElementById("copy-button");
  const copyText = document.getElementById("copy-text");
  const websiteInput = document.getElementById("website-input");
  if (!copyButton || !copyText || !websiteInput || copyButton.dataset.tailadminCopy === "ready") return;

  copyButton.dataset.tailadminCopy = "ready";
  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(websiteInput.value).then(() => {
      copyText.textContent = "Copied";
      setTimeout(() => {
        copyText.textContent = "Copy";
      }, 2000);
    });
  });
}

window.tailAdminBlazor = {
  initializePage() {
    const app = document.querySelector("#app");
    if (app) {
      Alpine.initTree(app);
    }

    initFlatpickr();
    initDropzone();
    initCalendar();
    initSearchShortcut();
    initCopyButton();
    chart01();
    chart02();
    chart03();
    map01();

    const year = document.getElementById("year");
    if (year) {
      year.textContent = new Date().getFullYear();
    }
  },
};

document.addEventListener("keydown", (event) => {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  if ((event.metaKey || event.ctrlKey) && event.key === "k") {
    event.preventDefault();
    searchInput.focus();
  }

  if (event.key === "/" && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput.focus();
  }
});

Alpine.start();
