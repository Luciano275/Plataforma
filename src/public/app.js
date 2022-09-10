const formAdd = document.querySelector("#formAdd");
let f;

formAdd.addEventListener('submit', (e) => {
    e.preventDefault();
    f = document.querySelector('#formAdd input[type=file]');
    console.log(f.files[0])
    fetch('/api-rest/add', {
        method: 'POST',
        body: JSON.stringify({
            arch: f.files[0]
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(rs => rs.json())
        .then(data => console.log(data))
})