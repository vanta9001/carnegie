function hideFields(form) {
  const cssClasses = [
    "hs_company",
    "hs_state__province",
    "hs_company_address",
    "hs-city",
    "hs_district_name__c",
    "hs_county__c",
  ];
  for (const className of cssClasses) {
    showOrHideFieldByClassName(form, className, "none");
  }
}

function showOrHideFieldByClassName(parentForm, className, display) {
  let fields = parentForm.querySelectorAll(`[class~="${className}"]`);
  for (let field of fields) {
    if (field !== null && field !== undefined) {
      field.parentElement.style.display = display;
    }
  }
}

function showFields(form) {
  const cssClasses = [
    "hs_company",
    "hs_state__province",
    "hs_company_address",
    "hs-city",
    "hs_district_name__c",
    "hs_county__c",
  ];
  for (const className of cssClasses) {
    showOrHideFieldByClassName(form, className, "block");
  }
}

// Used to clear Field values
function clearFields(form) {
  const selectors = [
    "input[name=company]",
    "select[name=state__province]",
    "input[name='0-2/institution_name']",
    "input[name=company_address]",
    "input[name=city]",
    "input[name=district_name__c]",
    "input[name=mch_identifier]",
    "input[name=mch_ultimate_parent_id]",
    "input[name=mch_ultimate_parent_name]",
    "input[name=school_or_district_2]",
  ];

  selectors.forEach((selector) => {
    let element = form.querySelector(selector);
    if (
      element != null &&
      element !== undefined &&
      element.value != "" &&
      element.value != null
    ) {
      element.value = "";
      let evt = new Event("change");
      if (typeof element.onchange != "function") {
        evt = new Event("input");
      }
      element.dispatchEvent(evt);
    }
  });
}

function changeFieldValue(form, selector, value) {
  let element = form.querySelector(selector);
  if (element !== null && element !== undefined) {
    element.value = value;
    let evt = new Event("change", { bubbles: true });
    if (typeof element.onchange != "function") {
      evt = new Event("input", { bubbles: true });
    }
    element.dispatchEvent(evt);
  }
}

function getSchoolData(evt) {
  let form = evt.target.closest("form");
  if (evt.target.value != "other") {
    clearFields(form);
    hideFields(form);
    let url = "https://www.carnegielearning.com/_hcms/api/postal-code";

    fetch(`${url}?id=${evt.target.value}`)
      .then((res) => res.json())
      .then((data) => {
        let query = data.payload;
        let districtNameC =
          query.parentName || query.mainParentName || query.institutionName;
        var mainParentID =
          query.mainParentID || query.parentID || query.institutionID;
        var mainParentName =
          query.mainParentName || query.parentName || query.institutionName;

        let fields = {
          "input[name=company]": query.institutionName,
          "select[name=state__province]": query.mailingState,
          "input[name='0-2/institution_name']": query.institutionName,
          "input[name=company_address]": query.mailingAddress,
          "input[name=city]": query.mailingCity,
          "input[name=mch_identifier": query.institutionID,
          "input[name=district_name__c]": districtNameC,
          "input[name=mch_ultimate_parent_id]": mainParentID,
          "input[name=mch_ultimate_parent_name]": mainParentName,
          "input[name=school_or_district_2]": query.institutionName,
        };

        // Change the values of all linked form fields if they're present.
        for (const [k, v] of Object.entries(fields)) {
          changeFieldValue(form, k, v);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    clearFields(form);

    changeFieldValue(form, "input[name=school_or_district_2]", "Other");
    showFields(form);
  }
}

// Query API, set inner Options of select element
function querySchools(form) {
  let postalCodeField = form.querySelector("input[name=zip]");
  clearFields(form);
  let url = "https://www.carnegielearning.com/_hcms/api/postal-code";

  fetch(
    `${url}?mailingZip=${postalCodeField.value}&institutionName=&pageSize=100&pageNumber=1`
  )
    .then((res) => res.json())
    .then((data) => {
      let organizations = data.payload;
      if (organizations != null) {
        let schoolSearchDropdown = form.querySelector(".cl-select");
        schoolSearchDropdown.disabled = true;
        // Remove all the school search options.
        while (schoolSearchDropdown.options.length > 0) {
          schoolSearchDropdown.options.remove(0);
        }
        let firstOption = new Option("Searching schools...");
        schoolSearchDropdown.add(firstOption, undefined);

        for (let i = 0; i < organizations.length; i++) {
          let option = document.createElement("option");
          option.value = organizations[i].institutionID;
          option.text = organizations[i].institutionName;
          schoolSearchDropdown.appendChild(option);
        }

        let otherOption = document.createElement("option");
        otherOption.value = "other";
        otherOption.text = "Other";
        schoolSearchDropdown.appendChild(otherOption);
        setTimeout(() => {
          firstOption.innerText = "Select a School or District";
          schoolSearchDropdown.disabled = false;
        }, 100);
      }
    })
    .catch((err) => {
      console.log(err);
      let schoolSearchDropdown = form.querySelector(".cl-select");
      schoolSearchDropdown.options[0].innerText = "Please select Other";
      schoolSearchDropdown.options[0].disabled = true;
      let otherOption = document.createElement("option");
      if (
        schoolSearchDropdown.options[schoolSearchDropdown.options.length - 1]
          .innerText != "Other"
      ) {
        otherOption.value = "other";
        otherOption.text = "Other";
        schoolSearchDropdown.appendChild(otherOption);
      } else {
        otherOption = form.querySelector("input[value=other]");
      }

      otherOption.selected = true;
      schoolSearchDropdown.dispatchEvent(new Event("change"));
      schoolSearchDropdown.disabled = false;
    });
}
let timeout = null;
function createSchoolSearch(form) {
  // Create the dropdown element.
  const schoolSearchDropdown = document.createElement("select");

  // Add classes and disable the select list.
  schoolSearchDropdown.classList.add("hs-form__field__input");
  schoolSearchDropdown.classList.add("cl-select");
  schoolSearchDropdown.classList.add("obo-select");
  schoolSearchDropdown.disabled = true;

  // Add placeholder text to disabled dropdown
  schoolSearchDropdown.add(
    new Option("Enter a valid Zip / Postal code."),
    undefined
  );

  // Attach event listener.
  schoolSearchDropdown.addEventListener("change", getSchoolData);
  let schoolIdField = form.querySelector("input[name='school_or_district_2']");
  schoolIdField.type = "hidden";
  schoolIdField.parentNode.appendChild(schoolSearchDropdown);

  let postalCodeField = form.querySelector("input[name=zip]");
  let cleave = null;
  postalCodeField.addEventListener("input", function (e) {
    if (cleave) {
      cleave.destroy();
    }
    if (
      e.target.value.match(/^[A-Z]/i) &&
      e.inputType != "deleteContentForward" &&
      e.inputType != "deleteContentBackward"
    ) {
      if (window.Cleave !== undefined && window.Cleave !== null) {
        cleave = new window.Cleave(postalCodeField, {
          delimiter: " ",
          blocks: [3, 3],
          uppercase: true,
        });
      }
    }

    schoolSearchDropdown.options[0].innerHTML = "Searching schools...";

    // Run School Search
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      if (!e.target.value.length) {
        schoolSearchDropdown.options.forEach((option) => option.remove());
        schoolSearchDropdown.disabled = true;
        schoolSearchDropdown.add(
          new Option("Enter a valid Zip / Postal code."),
          undefined
        );
      } else {
        querySchools(form);
      }
    }, 1000);
  });
}

function reformatSubmitButton(button) {
  if (button !== null && button !== undefined) {
    let buttonClasses = Array.from(button.classList).join(" ");
    button.outerHTML = `<button class='${buttonClasses}'>${button.value}</button>`;
  }
}

function attachHsForm(form) {
  console.log(`Attaching form ${form.id}`);
  form.setAttribute("hs-form-attached", true);

  reformatSubmitButton(form.querySelector("input.hs-button[type=submit]"));
  createSchoolSearch(form);
  hideFields(form);
}

window.addEventListener("message", (event) => {
  if (
    event.data.type === "hsFormCallback" &&
    event.data.eventName === "onFormReady"
  ) {
    let forms = document.querySelectorAll(
      `form.hs-form:not([hs-form-attached]):has(input[name='school_or_district_2'])`
    );

    for (let form of forms) {
      attachHsForm(form);
    }
  }
});
