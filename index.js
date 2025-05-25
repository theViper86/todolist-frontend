import { jwtDecode } from "jwt-decode";
import {
  SignUpCommand,
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { createClientForDefaultRegion } from "./util-aws-sdk.js";
import { ToDoList } from "./api.js";

function toggleSignUpThings(show = false) {
  const signUpThings = document.querySelectorAll(".sign-up-inputs");
  for (const signUpThing of signUpThings) {
    signUpThing.style.display = show ? "block" : "none";
  }
  const signUpVerificationThings = document.querySelectorAll(".sign-up-vcode");
  for (const signUpVerificationThing of signUpVerificationThings) {
    signUpVerificationThing.style.display = show ? "none" : "block";
  }
}

function signUp({ fullName, email, password }) {
  const command = new SignUpCommand({
    ClientId: window.cognitoClientId,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
      {
        Name: "given_name",
        Value: fullName,
      },
    ],
  });

  const client = createClientForDefaultRegion(CognitoIdentityProviderClient);
  client
    .send(command)
    .then((res) => {
      if (res.UserConfirmed === false) {
        localStorage.setItem("username", email);
        localStorage.setItem("name", fullName);
        toggleSignUpThings();
        alert(
          `A confirmation code has been sent to your email: ${res.CodeDeliveryDetails.Destination}`
        );
      }
    })
    .catch((err) => {
      if (typeof err.message === "string") {
        alert(err.message);
      }
    });
}

function signIn({ email, password }) {
  const command = new InitiateAuthCommand({
    ClientId: window.cognitoClientId,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: {
      PASSWORD: password,
      USERNAME: email,
    },
  });

  const client = createClientForDefaultRegion(CognitoIdentityProviderClient);
  client
    .send(command)
    .then((res) => {
      if (typeof res?.AuthenticationResult?.IdToken === "string") {
        localStorage.setItem("auth-token", res?.AuthenticationResult?.IdToken);
        window.dispatchEvent(new Event("storage"));
      }
    })
    .catch((err) => {
      if (typeof err.message === "string") {
        alert(err.message);
      }
    });
}

function confirmSignUp(signUpConfirmationCode) {
  const usernameToVerify = localStorage.getItem("username");
  if (usernameToVerify) {
    const command = new ConfirmSignUpCommand({
      ClientId: window.cognitoClientId,
      ConfirmationCode: signUpConfirmationCode,
      Username: usernameToVerify,
    });

    const client = createClientForDefaultRegion(CognitoIdentityProviderClient);
    client
      .send(command)
      .then((res) => {
        if (res.$metadata.httpStatusCode == "200") {
          resetForm();
          document.querySelector("#login-tab").click();
          alert("Account verified, Please login to continue.");
        }
      })
      .catch((err) => {
        if (typeof err.message === "string") {
          alert(err.message);
        }
      });
  }
}

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const signUpButton = document.getElementById("sign-up");
const signInButton = document.getElementById("sign-in");
const signUpConfirmationButton = document.getElementById("sign-up-vcode");

const loginToggleButton = document.getElementById("login-tab");
const signUpToggleButton = document.getElementById("signup-tab");

signUpButton.addEventListener("click", (e) => {
  e.preventDefault();
  const signUpInputfullname = document.getElementById("su-fullname");
  const signUpInputemail = document.getElementById("su-email");
  const signUpInputpassword = document.getElementById("su-password");
  if (signUpInputfullname.value === "") {
    alert("Please enter your full name.");
    return;
  }
  if (signUpInputemail.value === "") {
    alert("Please enter your email address.");
    return;
  }
  if (!validateEmail(signUpInputemail.value)) {
    alert("Please enter a valid email address.");
    return;
  }
  if (signUpInputpassword.value === "") {
    alert("Please enter password.");
    return;
  }
  if (signUpInputpassword.value.length < 8) {
    alert("Password must be atleast 8 character long.");
    return;
  }
  signUp({
    fullName: signUpInputfullname.value,
    email: signUpInputemail.value,
    password: signUpInputpassword.value,
  });
  console.log({
    fullName: signUpInputfullname.value,
    email: signUpInputemail.value,
    password: signUpInputpassword.value,
  });
});

signInButton.addEventListener("click", (e) => {
  e.preventDefault();
  const signInInputemail = document.getElementById("si-email");
  const signInInputpassword = document.getElementById("si-password");
  if (signInInputemail.value === "") {
    alert("Please enter your email address.");
    return;
  }
  if (signInInputpassword.value === "") {
    alert("Please enter password.");
    return;
  }
  signIn({
    email: signInInputemail.value,
    password: signInInputpassword.value,
  });
});

signUpConfirmationButton.addEventListener("click", (e) => {
  e.preventDefault();
  const signUpConfirmationCode = document.getElementById("su-vcode");
  if (signUpConfirmationCode.value.length !== 6) {
    alert("Confirmation code must be 6 digit long.");
    return;
  }
  confirmSignUp(signUpConfirmationCode.value);
});

loginToggleButton.addEventListener("click", () => {
  resetForm();
});

signUpToggleButton.addEventListener("click", () => {
  resetForm();
});

function resetForm() {
  toggleSignUpThings(true);
  const signUpInputfullname = document.getElementById("su-fullname");
  const signUpInputemail = document.getElementById("su-email");
  const signUpInputpassword = document.getElementById("su-password");
  signUpInputfullname.value = "";
  signUpInputemail.value = "";
  signUpInputpassword.value = "";

  const signInInputemail = document.getElementById("si-email");
  const signInInputpassword = document.getElementById("si-password");
  signInInputemail.value = "";
  signInInputpassword.value = "";

  const signUpConfirmationCode = document.getElementById("su-vcode");
  signUpConfirmationCode.value = "";
}

function logOut() {
  localStorage.clear();
  window.dispatchEvent(new Event("storage"));
}

function onLogIn() {
  const authToken = localStorage.getItem("auth-token");
  const decoded = jwtDecode(authToken);
  console.log(decoded);

  ToDoList.createUserOnSignIn(decoded.given_name, decoded.email)
    .then((res) => {
      console.log(res);
    })
    .catch((err) => {
      console.log(err);
    });

  if (decoded.email_verified !== true) {
    alert("Your email is not verified.");
    logOut();
    return;
  }
  if (Date.now() - decoded.exp * 1000 + 120000 > 0) {
    logOut();
    alert("Your session has expired, please re-login to continue.");
    window.location.reload();
    return;
  }

  document.querySelector("#sign-in-modal-close-button").click();

  const loginVisibleNodes = document.querySelectorAll(".login-visible");
  for (const loginVisibleNode of loginVisibleNodes) {
    loginVisibleNode.style.display = "block";
  }
  const logoutVisibleNodes = document.querySelectorAll(".logout-visible");
  for (const logoutVisibleNode of logoutVisibleNodes) {
    logoutVisibleNode.style.display = "none";
  }
  ToDoList.getTodo();
}

function onLogOut() {
  const loginVisibleNodes = document.querySelectorAll(".login-visible");
  for (const loginVisibleNode of loginVisibleNodes) {
    loginVisibleNode.style.display = "none";
  }
  const logoutVisibleNodes = document.querySelectorAll(".logout-visible");
  for (const logoutVisibleNode of logoutVisibleNodes) {
    logoutVisibleNode.style.display = "block";
  }
}

function init() {
  const authToken = localStorage.getItem("auth-token");
  if (authToken) {
    onLogIn();
  } else {
    onLogOut();
    document.querySelector("#login-button").click();
  }
}

init();

window.addEventListener("storage", () => {
  const authToken = localStorage.getItem("auth-token");
  if (authToken) {
    onLogIn();
  } else {
    onLogOut();
  }
});

setInterval(() => {
  const authToken = localStorage.getItem("auth-token");
  if (!authToken) return;
  const decoded = jwtDecode(authToken);

  if (Date.now() - decoded.exp * 1000 + 120000 > 0) {
    logOut();
    alert("Your session has expired, please re-login to continue.");
    window.location.reload();
    return;
  }
}, 60000);

document.querySelector("#logout-button").addEventListener("click", () => {
  logOut();
});

document.querySelector("#submit-todo").addEventListener("click", () => {
  const taskType = document.querySelector("#task_type").value;
  const taskDescription = document.querySelector("#task_description").value;
  const taskStartDate = document.querySelector("#txtDate").value;
  const taskDueDate = document.querySelector("#txtDate").value;
  const taskStatus = document.querySelector("#statues").value;
  console.log(taskStartDate);

  if (typeof taskType === "string" && taskType.length < 1) {
    alert("Task type is required.");
    return;
  }
  if (typeof taskDescription === "string" && taskDescription.length < 1) {
    alert("Task description is required.");
    return;
  }
  if (typeof taskStartDate === "string" && taskStartDate.length < 1) {
    alert("Task due date is required.");
    return;
  }
  if (typeof taskStatus === "string" && taskStatus.length < 1) {
    alert("Task status is required.");
    return;
  }
  if (window.currentEditId) {
    ToDoList.updateTodo({
      category: taskType,
      description: taskDescription,
      startDate: taskStartDate,
      endDate: taskDueDate,
      status: taskStatus,
    });
  } else {
    ToDoList.createTodo({
      category: taskType,
      description: taskDescription,
      startDate: taskStartDate,
      endDate: taskDueDate,
      status: taskStatus,
    });
  }
});

document.querySelector("#add-task").addEventListener("click", (e) => {
  if (e.isTrusted) {
    window.currentEditId = undefined;
    ToDoList.clearForm();
  }
});

document.querySelector("#refresh").addEventListener("click", (e) => {
  e.preventDefault();
  ToDoList.getTodo();
});

document.querySelector("#fsearch").addEventListener("click", (e) => {
  e.preventDefault();
  const taskType = document.querySelector("#ftask_type").value;
  const status = document.querySelector("#fstatues").value;
  ToDoList.getTodo(taskType, status);
});
