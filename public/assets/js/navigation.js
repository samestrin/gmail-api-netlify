$(document).ready(function () {
  $(".nav-scroll").on("click", function (event) {
    var target = $(this.getAttribute("href"));
    console.log(target.length);
    if (target.length) {
      event.preventDefault();
      $("html, body").animate(
        {
          scrollTop: target.offset().top - 70,
        },
        1000,
        "swing" // Changed to a more commonly available easing function
      );
    }
  });
});
