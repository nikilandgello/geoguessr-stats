export function displayGlobalErrorUI(
  errorMessageHTML = "Something went wrong. <br/>Please try again later."
) {
  const contentWrapperId = "content-wrapper";
  const noDataContainerId = "no-data";
  const noDataTextSelector = ".no-data-text";
  const errorTextSelector = ".error-text";

  const contentWrapper = document.getElementById(contentWrapperId);
  const noDataContainer = document.getElementById(noDataContainerId);

  if (contentWrapper) {
    contentWrapper.style.display = "none";
  }

  if (noDataContainer) {
    noDataContainer.style.display = "flex";
    const noDataTextEl = noDataContainer.querySelector(noDataTextSelector);
    noDataTextEl.style.display = "none";
    const errorTextEl = noDataContainer.querySelector(errorTextSelector);
    errorTextEl.style.display = "block";
    if (errorTextEl) {
      errorTextEl.innerHTML = errorMessageHTML;
    }
  }
}
