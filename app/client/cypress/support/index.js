// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
require("cypress-xpath");
let pageid;
let appId;

// Import commands.js using ES2015 syntax:
import "./commands";
import { initLocalstorage } from "./commands";

Cypress.on("uncaught:exception", (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false;
});

Cypress.on("fail", (error, runnable) => {
  throw error; // throw error to have test still fail
});

before(function() {
  initLocalstorage();
  cy.startServerAndRoutes();
  // Clear indexedDB
  cy.window().then((window) => {
    window.indexedDB.deleteDatabase("Appsmith");
  });

  //Temporary commented out to fix loginFromApi command
  // cy.visit("/setup/welcome");
  // cy.wait("@getUser");
  // cy.url().then((url) => {
  //   if (url.indexOf("setup/welcome") > -1) {
  //     cy.createSuperUser();
  //     cy.LogOut();
  //   }
  // });

  // cy.SignupFromAPI(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"));
  // cy.SignupFromAPI(Cypress.env("TESTUSERNAME2"), Cypress.env("TESTPASSWORD2"));
  // cy.LogOut();
  // initLocalstorage();
  // Cypress.Cookies.preserveOnce("SESSION");
  const username = Cypress.env("USERNAME");
  const password = Cypress.env("PASSWORD");
  cy.LoginFromAPI(username, password);
  cy.visit("/applications");
  cy.wait("@applications").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );

  cy.generateUUID().then((id) => {
    appId = id;
    cy.CreateAppInFirstListedOrg(id);
    localStorage.setItem("AppName", appId);
  });

  cy.fixture("example").then(function(data) {
    this.data = data;
  });
});

beforeEach(function() {
  initLocalstorage();
  Cypress.Cookies.preserveOnce("SESSION");
  cy.startServerAndRoutes();
});

after(function() {
  //-- Deleting the application by Api---//
  cy.DeleteAppByApi();
  //-- LogOut Application---//
  cy.LogOut();
});
