const socket = io();

let profDiv = document.querySelector('.profesores-div');
let alumDiv = document.querySelector('.alumnos-div')

let m = {
    mensaj: '',
    de: '',
    para: ''
}

document.querySelector('nav .buttons .button-notify .opacidad').addEventListener('click', (e) => {
    if((/opacidad/).test(e.target.className)){
        e.target.classList.toggle('opacidad-active')
    }
})

function getProfesoresFunction(){
    socket.on("ineedprof", (data) => {
        if(data.profesoresArray.length > 0){

            $('#titulo-profesores').text("Profesores")
    
            let tm = '';
    
            data.profesoresArray.forEach((d) => {
                tm += `
                <div class='profesor-div' key='${d.ID}'>
                    <h2>${d.rol} ${d.nombre.substring(0,15)} ${d.apellido.substring(0,15)}</h2>
                    ${d.status == 'online' ? `<span class='profesor-status online'></span><span class='enviar-mensaje'>Enviar mensaje por privado</span>` : `<span class='profesor-status offline'></span><span class='enviar-mensaje'>Enviar mensaje por privado</span>`}
                </div>
                `
            })
    
            profDiv.innerHTML = tm;
    
        }else{
            $('#titulo-profesores').text('No hay profesores registrados.')
        }
    })
}

function getAlumnosFunction(){
    socket.on("ineedprof", (data) => {
        if(data.alumnosArray.length > 0){
    
            $('#titulo-alumnos').text('Alumnos')

            let tm = '';
    
            data.alumnosArray.forEach((d) => {
                tm += `
                <div class='alumno-div' key='${d.ID}'>
                    <h2>${d.rol} ${d.nombre.substring(0,15)} ${d.apellido.substring(0,15)}</h2>
                    ${d.status == 'online' ? `<span class='alumno-status online'></span><button class='enviar-mensaje'>Enviar mensaje por privado</button>` : `<span class='alumno-status offline'></span><button class='enviar-mensaje'>Enviar mensaje por privado</button>`}
                </div>
                `
            })
    
            alumDiv.innerHTML = tm;
    
        }else{
            $('#titulo-alumnos').text('No hay alumnos registrados.')
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
                .then((rs) => {
                    socket.emit('ineedprof', (true))
                    window.location.reload();
                    window.location.href = '/'
                })
        }
    })
})

const scrollToBottom = (elemento) => {
    elemento.scrollTo(0, elemento.scrollHeight);
}

function s(){

    socket.emit('ineedallmessage', (true))
    socket.on('ineedallmessage', (resultados) => {
        if(resultados.status == 200){
            socket.emit('seemessage', ({
                de: m.de,
                para: m.para
            }))
        }
    })
}

socket.on('seemessage', (data) => {

    let tmp = '';
    let i = 0;

    data.resul.forEach((resultado, index) => {
        if((resultado.de == m.de && resultado.para == m.para) || (resultado.de == m.para && resultado.para == m.de)){
            if(resultado.de == m.de){
                tmp+=`
                <div class='modal-chat-container' ky='themodal'>
                    <h6 class='modal-fecha' ky='themodal'>${resultado.fecha}</h6>
                    <p class='author' ky='themodal'>
                        <span class='author-span' ky='themodal'>${resultado.mensaje}</span>
                    </p>
                    <h6 class='modal-ver modal-ver-author' ky='themodal'>
                        <span>${resultado.ver == 'sinver' ? 'sin ver' : 'visto'}</span>
                    </h6>
                </div>
                `
            }else{
                tmp+=`
                <div class='modal-chat-container' ky='themodal'>
                    <h6 class='modal-fecha' ky='themodal'>${resultado.fecha}</h6>
                    <p class='receptor' ky='themodal'>
                        <span class='receptor-span' ky='themodal'>${resultado.mensaje}</span>
                    </p>
                    <h6 class='modal-ver modal-ver-receptor' ky='themodal'>
                        <span>${resultado.ver == 'sinver' ? 'sin ver' : 'visto'}</span>
                    </h6>
                </div>
                `
            }
        }
    })

    $('.modal-chat').html(tmp);
    
    scrollToBottom(document.getElementById('modalChat'))

    while(i < document.getElementsByClassName('modal-fecha').length){
        if(document.getElementsByClassName('modal-fecha')[i].innerText === document.getElementsByClassName('modal-fecha')[i+1].innerText){
            document.getElementsByClassName('modal-fecha')[i+1].style.display = 'none';
        }
        i++;
    }

})

function messagesFunction(){

    const regexExpModal = /themodal/;
    const _id = document.querySelector('#id-p').innerText;

    let modal = document.querySelector('.modal-mensaje')

    let modalReceptor = document.querySelector('#modal-receptor');
    let modalStatus = document.querySelector('#modal-status');
    let msg = document.querySelector('#msg');

    $(document).on('click', '.enviar-mensaje', function(ev){
        ev.stopPropagation();
        //$(this) lista de elemntos [0]: solo el primero
        let key = $(this)[0].parentElement.getAttribute('key');
        modal.classList.toggle('open-modal')
        socket.emit('ineedauser', (key))
        socket.on('ineedauser', (datos) => {
            if(_id == datos.re[0].ID){
                Swal.fire({
                    title: 'Message',
                    text: 'No puedes enviarte mensajes a ti mismo.',
                    icon: 'error'
                })
                modal.classList.remove('open-modal')
                modalReceptor.innerText = '';
                modalStatus.innerHTML = '';
                m.mensaj = '';
                m.de = '';
                m.para = '';
            }else{
                modalReceptor.innerText = `${datos.re[0].rol} ${datos.re[0].nombre.substring(0,7)} ${datos.re[0].apellido.substring(0,5)}`;
                modalStatus.innerText = datos.re[0].status;
                m.de = _id;
                m.para = key;
                s();
            }
        })
    })

    window.addEventListener('click', (e) => {
        if(!regexExpModal.test(e.target.getAttribute('ky'))){
            modal.classList.remove('open-modal')
            modalReceptor.innerText = '';
            modalStatus.innerHTML = '';
            m.mensaj = '';
            m.de = '';
            m.para = '';
        }
    })

    msg.addEventListener('change', (e) => {
        m.mensaj = e.target.value;
    })

    document.querySelector('.modal-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if((/\w{1,}/).test(m.mensaj)){
            socket.emit('isendamessage', (m));
            msg.value = '';
            s();
        }else{
            Swal.fire({
                title: 'Mensaje',
                text: 'Por lo menos 1 caracter',
                icon: 'error',
                showConfirmButton: 'Intentar de nuevo'
            })
        }
    })

    socket.on('isendamessage', (dts) => {})
}

const PROFESORES = '/login/auth/perfect/profesores';
const ALUMNOS = '/login/auth/perfect/alumnos';

window.addEventListener('load', () => {

    socket.emit('ineedprof', {
        status: 200
    });

    let path = window.location.pathname;
    let anchors = document.querySelectorAll("nav .titulo a");

    switch(path){
        case PROFESORES:

            getProfesoresFunction();
            setTimeout(() => {
                messagesFunction();
            }, 1000);

            anchors.forEach((anchor) => anchor.id === PROFESORES ? anchor.classList.add('activeWeb'):anchor.classList.remove('activeWeb'))

            break;

        case ALUMNOS:

            getAlumnosFunction()
            setTimeout(() => {
                messagesFunction();
            }, 1000);

            anchors.forEach((anchor) => anchor.id === ALUMNOS ? anchor.classList.add('activeWeb'):anchor.classList.remove('activeWeb'))
            break;

        default:
            anchors.forEach((anchor) => anchor.classList.remove("activeWeb"))
    }

})