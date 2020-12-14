window.addEventListener('load', function() {
    var status = document.getElementById("status")
    status.className = "text-uppercase text-white"

    var submitButton = document.getElementById("uploadbanner")
    submitButton.onsubmit = function() {
        status.className = "text-uppercase text-danger"
    }
})
