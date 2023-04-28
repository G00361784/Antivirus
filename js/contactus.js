function submit() {
    document.getElementById('popupForm').style.display = 'block';   

        var count = 5;
    setInterval(function(){
        count--;
        if (count == 0) {
            window.location = 'https://www.shelldefender.ie/index.html'; 
        }
    },1000);
}