const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;

// Configuration API
const API_KEY = "AIzaSyBK58PQ_8r3LX32iCGQMUT88lr2ZcnzvJk";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const loadLocalstorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    // Appliquer le thème stocké
    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    // Restaurer les discussions enregistrées
    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight); // faire défiler vers le bas
}

loadLocalstorageData();

// Créer un nouvel élément de message et le renvoyer
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

// Afficher l'effet de frappe en affichant les mots un par un
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentdWordIndex = 0;

    const typingInterval  = setInterval(() => {
        // Ajoutez chaque mot à l'élément de texte avec un espace
        textElement.innerText += (currentdWordIndex === 0 ? '' : ' ') + words[currentdWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        // Si tous les mots sont affichés
        if(currentdWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML); // Enregistrer les discussions sur le stockage local
        }
        chatList.scrollTo(0, chatList.scrollHeight); // faire défiler vers le bas
    }, 75);
}

// Récupérer la réponse de l'API en fonction du message de l'utilisateur
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text"); // Obtenir un élément de texte

    // Envoyer une requête POST à ​​l'API avec le message de l'utilisateur
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);

        // Obtenir la réponse de l'API et supprimez les astérisques
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    } catch (error) {
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
}

// Afficher une animation de chargement en attendant la réponse de l'API
const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                <img src="icon/virtuality.png" alt="Virtuality Image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);

    chatList.scrollTo(0, chatList.scrollHeight); // faire défiler vers le bas
    generateAPIResponse(incomingMessageDiv);
}

// Copier le texte du message dans le presse-papiers
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; // Afficher l'icône de coche
    setTimeout(() => copyIcon.innerText = "content_copy", 1000); // Icône de rétablissement après 1 seconde
}

const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return; // Quitter s'il n'y a pas de message

    isResponseGenerating = true;

    const html = `<div class="message-content">
                        <img src="icon/user.png" alt="User Image" class="avatar">
                        <p class="text"></p>
                    </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); // Effacer le champ de saisie
    chatList.scrollTo(0, chatList.scrollHeight); // faire défiler vers le bas
    document.body.classList.add("hide-header"); // Masquer l'en-tête une fois le chat démarré
    setTimeout(showLoadingAnimation, 500); // Afficher l'animation de chargement après un délai
}

// Définir userMessage et gérer le chat sortant lorsqu'un utilisateur clique sur une suggestion
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click", () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});

// Basculer entre les thèmes clairs et sombres
toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
})

// Supprimez toutes les discussions du stockage local lorsque vous cliquez sur le bouton
deleteChatButton.addEventListener("click", () => {
    if(confirm("Etes-vous sûr de vouloir supprimer tous les messages ?")) {
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    };
});

// Empêcher la soumission de formulaire par défaut et gérer le chat sortant 
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    handleOutgoingChat()
});