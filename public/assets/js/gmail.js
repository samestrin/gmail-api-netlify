$(document).ready(function () {
  $("#emailForm").on("submit", function (event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append("to", $("#to").val());
    formData.append("cc", $("#cc").val());
    formData.append("bcc", $("#bcc").val());
    formData.append("from", $("#from").val());
    formData.append("subject", $("#subject").val());
    formData.append("body", $("#body").val());
    const attachmentUrl = $("#attachmentUrl").val();
    const attachmentFile = $("#attachmentFile")[0].files[0];

    if (attachmentUrl) {
      formData.append("attachment", JSON.stringify({ path: attachmentUrl }));
    } else if (attachmentFile) {
      formData.append("attachment", attachmentFile);
    }

    $.ajax({
      url: "/api/gmail",
      method: "POST",
      headers: {
        username: $("#username").val(),
        password: $("#password").val(),
      },
      processData: false,
      contentType: false,
      data: formData,
      success: function (response) {
        $("#response").html(
          `<div class="alert alert-success">Email sent successfully!</div>`
        );
        $("#errorModalLabel").text("Success");
        $("#errorMessage").text("Email sent successfully!");
        $("#errorModal").modal("show");
      },
      error: function (error) {
        $("#response").html(
          `<div class="alert alert-danger">Error sending email: ${error.responseText}</div>`
        );
        $("#errorModalLabel").text("Error");
        $("#errorMessage").text(`Error sending email: ${error.responseText}`);
        $("#errorModal").modal("show");
      },
    });
  });
});
