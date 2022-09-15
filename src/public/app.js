const socket = io();

function getProfesoresFunction(){
    socket.on("ineedprof", (data) => {
        if(data.profesoresArray.length > 0){
    
            let tm = '';
    
            data.profesoresArray.forEach((d) => {
                tm += `
                <div class='profesor-div'>
                    <h2>${d.rol} ${d.nombre.substring(0,15)} ${d.apellido.substring(0,15)}</h2>
                    ${d.status == 'online' ? `<span class='profesor-status online'></span><span class='enviar-mensaje'>Enviar mensaje por privado</span>` : `<span class='profesor-status offline'></span><span class='enviar-mensaje'>Enviar mensaje por privado</span>`}
                </div>
                `
            })
    
            profDiv.innerHTML = tm;
    
        }else{
            document.querySelector("#titulo-profesores").innerText = 'No hay profesores registrados.'
        }
    })
}

document.querySelector('#logout').addEventListener('click', () => {
    Swal.fire({
        title: 'Logout',
        text: 'Closing session...',
        timer: 1000,
        timerProgressBar: true,
    }).then((result) => {
        if(result.dismiss === Swal.DismissReason.timer){
            fetch('/api-rest/logout')
                .then((rs) => rs.json())
                .then((dt) => {
                    socket.emit('ineedprof', (true))
                    Swal.fire({
                        title: 'Logout',
                        text: 'Session Closed!',
                        icon: 'success',
                        timer: 700
                    })
                        .then(() => {
                            window.location.reload();
                            window.location.href = '/'
                        })
                })
        }
    })
})

const PROFESORES = '/login/auth/perfect/profesores';
const ALUMNOS = '/login/auth/perfect/profesores';

let profDiv = document.querySelector('.profesores-div');

window.addEventListener('load', () => {

    socket.emit('ineedprof', {
        status: 200
    });
    
    getProfesoresFunction();

    let path = window.location.pathname;
    let anchors = document.querySelectorAll("nav .titulo a");

    switch(path){
        case PROFESORES:

            anchors.forEach((anchor) => anchor.id === PROFESORES ? anchor.classList.add('activeWeb'):anchor.classList.remove('activeWeb'))

            break;

        case ALUMNOS:
            anchors.forEach((anchor) => anchor.id === ALUMNOS ? anchor.classList.add('activeWeb'):anchor.classList.remove('activeWeb'))
            break;

        default:
            anchors.forEach((anchor) => anchor.classList.remove("activeWeb"))
    }

})