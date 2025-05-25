import { BASE_URL } from "./constants";
import { jwtDecode } from "jwt-decode";

window.todoItemOnChangeEvent = (e) => {
  console.log(e.attributes.dataid.value);
  console.log(e.options[e.selectedIndex].value);
  ToDoList.updateTodoStatus(
    e.attributes.dataid.value,
    e.options[e.selectedIndex].value
  );
};

window.todoItemOnDeleteEvent = (id) => {
  ToDoList.deleteTodo(id);
};

window.todoItemOnEditEvent = (id, category, description, startDate, status) => {
  console.log(id, category, description, startDate, status);
  const thisDate = new Date(startDate);
  document.querySelector("#task_type").value = category;
  document.querySelector("#task_description").value = description;
  document.querySelector("#txtDate").value = `${thisDate.getFullYear()}-${(
    thisDate.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${thisDate.getDate().toString().padStart(2, "0")}`;
  document.querySelector("#statues").value = status;
  window.currentEditId = id;
  document.querySelector("#add-task").click();
};

export class ToDoList {
  static createUserOnSignIn(name, email) {
    return new Promise((resolve, reject) => {
      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("auth-token", localStorage.getItem("auth-token"));
      myHeaders.append("Cache-Control", "no-cache");
      var raw = JSON.stringify({
        name: name,
        email: email,
      });

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      this.showLoader();
      return fetch(`${BASE_URL}/user`, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          if (result.error) {
            reject();
            return;
          }
          localStorage.setItem("uid", result.result.id);
          resolve();
        })
        .catch((error) => {
          console.log("error", error);
          reject();
        })
        .finally(() => {
          this.hideLoader();
        });
    });
  }

  static clearForm() {
    document.getElementById("user_form").reset();
  }

  static showLoader() {
    document.getElementById("processing").style.display = "flex";
  }

  static hideLoader() {
    document.getElementById("processing").style.display = "none";
  }

  static createTodo({ category, description, startDate, endDate, status }) {
    return new Promise((resolve, reject) => {
      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("auth-token", localStorage.getItem("auth-token"));
      myHeaders.append("Cache-Control", "no-cache");

      var raw = JSON.stringify({
        category,
        description,
        startDate,
        endDate,
        status,
      });

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const uid = localStorage.getItem("uid");
      if (!uid) {
        reject();
        return;
      }

      this.showLoader();
      fetch(`${BASE_URL}/todo/${uid}`, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          if (result.error) {
            reject();
          }
          this.clearForm();
          document.querySelector("#todo-add-modal-close-button").click();
          ToDoList.getTodo();
          resolve();
        })
        .catch((error) => console.log("error", error))
        .finally(() => {
          this.hideLoader();
        });
    });
  }

  static async getTodo(category = "", status = "") {
    const TODO_COLOR_MAP = {
      Started: "#44a6fd",
      "In-Progress": "#fdb044",
      Completed: "#10bb27",
      Delayed: "#fd4444",
      "Not started": "#809597",
    };

    const uid = localStorage.getItem("uid");
    if (!uid) {
      const authToken = localStorage.getItem("auth-token");
      const decoded = jwtDecode(authToken);
      await ToDoList.getUserIdFromEmail(decoded.email);
      ToDoList.getTodo();
      return;
    }
    var myHeaders = new Headers();
    myHeaders.append("auth-token", localStorage.getItem("auth-token"));
    myHeaders.append("Cache-Control", "no-cache");
    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
    this.showLoader();
    fetch(
      `${BASE_URL}/todo/${uid}?skip=0&take=50${
        category ? `&category=${category}` : ""
      }${status ? `&status=${status}` : ""}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        let todosHtml = ``;
        let count = 0;
        if (Array.isArray(result.result)) {
          for (const todo of result.result) {
            todosHtml += `<tr>
            <td style="text-align:center;line-height: 40px;">${++count}</td>
            <td style="font-size:24px!important;line-height: 40px;">${
              todo.category
            }</td>
            <td style="word-break:break-all;line-height: 40px;max-width:350px;font-size:18px!important;">${
              todo.description
            }</td>
            <td style="font-size:18px!important;font-weight:bolder;line-height: 40px;">${new Date(
              todo.endDate
            ).toLocaleDateString()}</td>

            <td>

               <select class="form-control todo-item-status" dataid="${
                 todo.id
               }" onchange="todoItemOnChangeEvent(this)" required name="statues" style="min-width:150px;">
                  <option>Status</option>
                  <option value="Started"${
                    todo.status === "Started" ? " selected" : ""
                  }>Started</option>
                  <option value="In-Progress"${
                    todo.status === "In-Progress" ? " selected" : ""
                  }>In-Progress </option>
                  <option value="Completed"${
                    todo.status === "Completed" ? " selected" : ""
                  }>Completed</option>
                  <option value="Delayed"${
                    todo.status === "Delayed" ? " selected" : ""
                  }>Delayed</option>
                  <option value="Not started"${
                    todo.status === "Not started" ? " selected" : ""
                  }>Not started</option>
               </select>

            </td>
            <td>
               <button class="btn btn1s" style="line-height: 40px;cursor:unset;${
                 TODO_COLOR_MAP[todo.status]
                   ? "background:" + TODO_COLOR_MAP[todo.status] + ";"
                   : ""
               }"></button>
            </td>
            <td style="gap: 6px;" class="flex-center"><a onclick="todoItemOnEditEvent(${
              todo.id
            },'${todo.category}','${todo.description}','${todo.endDate}','${
              todo.status
            }')" style="font-size: 20px;"><i class="fa fa-edit"></i></a><a onclick="todoItemOnDeleteEvent(${
              todo.id
            })" style="font-size: 20px;"><i class="fa fa-trash"></i></a></td>
         </tr>`;
          }
          console.log(result.result.length);
          if (result.result.length === 0) {
            document.getElementById("no-task-warn").style.display = "flex";
          } else {
            document.getElementById("no-task-warn").style.display = "none";
          }
        }
        document.querySelector("#todo-items").innerHTML = todosHtml;
      })
      .catch((error) => console.log("error", error))
      .finally(() => {
        this.hideLoader();
      });
  }

  static updateTodoStatus(id, value) {
    return new Promise((resolve, reject) => {
      var myHeaders = new Headers();
      myHeaders.append("auth-token", localStorage.getItem("auth-token"));
      myHeaders.append("accept", "*/*");
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Cache-Control", "no-cache");

      var raw = JSON.stringify({
        status: value,
      });

      var requestOptions = {
        method: "PATCH",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const uid = localStorage.getItem("uid");
      if (!uid) {
        reject();
        return;
      }

      this.showLoader();
      fetch(`${BASE_URL}/todo/${uid}/${id}`, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          if (result.error) {
            reject();
          }
          ToDoList.getTodo();
          resolve();
        })
        .catch((error) => {
          console.log("error", error);
          reject();
        })
        .catch(() => {
          this.hideLoader();
        });
    });
  }

  static updateTodo({ category, description, startDate, endDate, status }) {
    return new Promise((resolve, reject) => {
      var myHeaders = new Headers();
      myHeaders.append("auth-token", localStorage.getItem("auth-token"));
      myHeaders.append("accept", "*/*");
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Cache-Control", "no-cache");

      var raw = JSON.stringify({
        category,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        status,
      });

      var requestOptions = {
        method: "PATCH",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const uid = localStorage.getItem("uid");
      if (!uid) {
        reject();
        return;
      }

      this.showLoader();
      fetch(`${BASE_URL}/todo/${uid}/${window.currentEditId}`, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          if (result.error) {
            reject();
            return;
          }
          this.clearForm();
          document.querySelector("#todo-add-modal-close-button").click();
          ToDoList.getTodo();
          window.currentEditId = undefined;
          resolve();
        })
        .catch((error) => {
          console.log("error", error);
          reject();
        })
        .finally(() => {
          this.hideLoader();
        });
    });
  }

  static deleteTodo(id) {
    return new Promise((resolve, reject) => {
      var myHeaders = new Headers();
      myHeaders.append("auth-token", localStorage.getItem("auth-token"));
      myHeaders.append("accept", "*/*");
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Cache-Control", "no-cache");

      var requestOptions = {
        method: "DELETE",
        headers: myHeaders,
        redirect: "follow",
      };

      const uid = localStorage.getItem("uid");
      if (!uid) {
        reject();
        return;
      }

      this.showLoader();
      fetch(`${BASE_URL}/todo/${uid}/${id}`, requestOptions)
        .then((response) => response.json())
        .then((result) => {
          if (result.error) {
            reject();
          }
          ToDoList.getTodo();
          resolve();
        })
        .catch((error) => {
          console.log("error", error);
          reject();
        })
        .finally(() => {
          this.hideLoader();
        });
    });
  }

  static getUserIdFromEmail(email) {
    return new Promise((resolve, reject) => {
      var myHeaders = new Headers();
      myHeaders.append("auth-token", localStorage.getItem("auth-token"));
      myHeaders.append("Cache-Control", "no-cache");
      var requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };
      this.showLoader();
      fetch(`${BASE_URL}/user/${encodeURIComponent(email)}`, requestOptions)
        .then((res) => res.json())
        .then((res) => {
          console.log(res);
          if (res?.result?.id) {
            localStorage.setItem("uid", res?.result?.id);
            resolve();
            return;
          }
          reject();
        })
        .catch((err) => {
          console.log(err);
          reject();
        })
        .finally(() => {
          this.hideLoader();
        });
    });
  }
}
