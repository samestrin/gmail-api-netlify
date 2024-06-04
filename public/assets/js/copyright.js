document.addEventListener("DOMContentLoaded", function () {
  const startYear = 2024;
  const currentYear = new Date().getFullYear();
  if (currentYear > startYear) {
    document.getElementById(
      "copyright"
    ).textContent = `${startYear}-${currentYear}`;
  }
});
