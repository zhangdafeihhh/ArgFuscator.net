document.addEventListener("DOMContentLoaded", () => {

    let toFind = document.querySelector('section>h1').innerText.toLowerCase();
    if (toFind) {
        try {
            fetch('https://lolbas-project.github.io/api/lolbas.json')
                .then(x => x.json())
                .then(x => x.filter(y => y.Name.toLowerCase() == `${toFind.replace('.exe', '')}.exe`))
                .then(x => { if (x.length > 0) { let command_count = x[0].Commands.length; a = document.createElement("a"); a.classList.add("button"); a.href = x[0].url; a.target = "_blank"; a.innerText = `LOLBAS Project (${command_count})`; document.getElementById("related-links").appendChild(a); } })
                .catch(e => console.error(`Could not connect to the LOLBAS project: ${e}`))
        } catch {
            console.warn("Could not connect to the LOLBAS project.")
        }
    }
}, false);
