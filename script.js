const converter = new showdown.Converter({
  backslashEscapesHTMLTags: true,
  emoji: true,
  excludeTrailingPunctuationFromURLs: true,
  ghCodeBlocks: true,
  ghCompatibleHeaderId: true,
  omitExtraWLInCodeBlocks: true,
  openLinksInNewWindow: true,
  parseImgDimensions: true,
  requireSpaceBeforeHeadingText: true,
  simpleLineBreaks: true,
  simplifiedAutoLink: true,
  smartIndentationFix: true,
  splitAdjacentBlockquotes: true,
  strikethrough: true,
  tables: true,
  tablesHeaderId: true,
  tasklists: true,
  underline: true,
});
const footer = document.querySelector('footer');
const overlay = document.querySelector('.overlay');
const nav = document.querySelector('nav');
const chatContainer = document.querySelector('.chat');
const textarea = document.querySelector('footer textarea');
const extra = document.querySelector('.extra');
let landing = document.querySelector('.chat .landing');
let lastHeight = textarea.scrollHeight;
let timeout;

function debounceSendRequest(message) {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    sendRequest(message);
  }, 400);
}

function toggleExtra() {
  if (extra.style.display == 'flex') {
    setTimeout(() => {
      extra.style.opacity = '0';
      extra.style.transform = 'translateY(100%)';
    }, 10);
    setTimeout(() => {
      extra.style.display = 'none';
    }, 400);
  } else {
    extra.style.display = 'flex';
    setTimeout(() => {
      extra.style.opacity = '1';
      extra.style.transform = 'translateY(0)';
    }, 10);
  }

  setTimeout(() => {
    getMeasurements();
  }, 500);
}

function sendRequest(message = 'Hi there!') {
  if (!landing.classList.contains('hidden')) {
    landing.classList.add('hidden');
  }
  toggleExtra();

  fetch('https://ai-server.regem.in/api/index.php', {
    headers: {
      accept: '*/*',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'input=' + encodeURIComponent(message.replace(/\n/g, ' ')),
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then((data) => {
      const output = data;
      const id = Array.from({ length: 6 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
      chatContainer.insertAdjacentHTML(
        'beforeend',
        `
            <div class="user ${id}" style="opacity: 0; transform: translateY(10px); transition: opacity 0.3s ease, transform 0.3s ease;">${message}</div>
            <div class="ai ${id}" style="opacity: 0; transform: translateY(10px); transition: opacity 0.3s ease, transform 0.3s ease;">${converter.makeHtml(output)}</div>
        `
      );
      if (output.includes('Keep supporting regem ai.')) {
        document.querySelector('.ai.' + id).innerText = 'Our server is facing some issues! Please message again later.';
      }
      const history = JSON.parse(localStorage.getItem('history')) || [];
      history.push([message, output]);
      localStorage.setItem('history', JSON.stringify(history));
      hljs.highlightAll();
      tableScroll();
      toggleExtra();
      animateChat();
      visualize();
    })
    .catch((error) => console.error('Request failed:', error));
}

function visualize() {
  try {
    mermaid();

    document.querySelectorAll('.mermaid:not(.visualized)').forEach((e) => {
      const mermaidCode = e.textContent.trim();

      const visualizerDiv = document.createElement('div');
      visualizerDiv.classList.add('visualizer');
      visualizerDiv.textContent = mermaidCode;

      const parentElement = e.parentNode;
      if (parentElement.tagName.toLowerCase() === 'pre') {
        parentElement.parentNode.insertBefore(visualizerDiv, parentElement.nextSibling);
      } else {
        e.parentNode.insertBefore(visualizerDiv, e.nextSibling);
      }

      e.classList.add('visualized');
      visualizerDiv.classList.add('visual-mermaid');
    });

    mermaid();
  } catch (e) {
    console.error(e);
  }

  try {
    document.querySelectorAll('.latex:not(.visualized)').forEach((e) => {
      const code = e.textContent.trim();
      const visualizerDiv = document.createElement('div');
      visualizerDiv.classList.add('visualizer');
      visualizerDiv.textContent = code;

      const parentElement = e.parentNode;
      if (parentElement.tagName.toLowerCase() === 'pre') {
        parentElement.parentNode.insertBefore(visualizerDiv, parentElement.nextSibling);
      } else {
        e.parentNode.insertBefore(visualizerDiv, e.nextSibling);
      }

      e.classList.add('visualized');
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, visualizerDiv]);
    });
  } catch (e) {
    console.error(e);
  }
}

function animateChat() {
  requestAnimationFrame(() => {
    document.querySelectorAll('.chat .user, .chat .ai').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      setTimeout(() => {
        el.style = null;
      }, 100);
    });
  });
}

function clearHistory() {
  localStorage.clear();
  landing.classList.remove('hidden');
  chatContainer.innerHTML = String(landing.outerHTML);
  landing = document.querySelector('.chat .landing');
}

textarea.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    debounceSendRequest(this.value);
    this.value = '';
  }

  if (textarea.scrollHeight !== lastHeight) {
    getMeasurements();
    lastHeight = textarea.scrollHeight;
  }
});

window.addEventListener('load', () => {
  const history = JSON.parse(localStorage.getItem('history')) || [];

  if (history.length != 0) {
    landing.classList.add('hidden');
  }

  history.forEach(([userMessage, aiMessage]) => {
    chatContainer.insertAdjacentHTML(
      'beforeend',
      `
            <div class="user" style="opacity: 0; transform: translateY(10px); transition: opacity 0.3s ease, transform 0.3s ease;">${userMessage}</div>
            <div class="ai" style="opacity: 0; transform: translateY(10px); transition: opacity 0.3s ease, transform 0.3s ease;">${converter.makeHtml(aiMessage)}</div>
        `
    );
  });

  hljs.highlightAll();
  tableScroll();
  animateChat();
  visualize();
  setTimeout(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, 200);
});

function tableScroll() {
  document.querySelectorAll('table').forEach((e) => {
    e.addEventListener('wheel', function (event) {
      if (this.scrollWidth > this.clientWidth) {
        event.preventDefault();
        this.scrollLeft += event.deltaY;
      }
    });
  });
}

function setupVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  document.querySelector('footer .actions').innerHTML += `
    • <button id="voice">Voice</button>
  `;

  let recognition = new SpeechRecognition();
  let isListening = false;

  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    document.getElementById('voice').textContent = 'Stop';
  };

  recognition.onresult = (event) => {
    document.querySelector('textarea').value = event.results[event.results.length - 1][0].transcript.trim();
  };

  recognition.onerror = recognition.onend = () => stopVoice();

  function toggleVoice() {
    if (isListening) {
      stopVoice();
    } else {
      recognition.start();
    }
  }

  function stopVoice() {
    isListening = false;
    recognition.stop();
    document.getElementById('voice').textContent = 'Voice';
  }

  document.getElementById('voice').addEventListener('click', toggleVoice);
}

setupVoiceRecognition();

function getMeasurements() {
  requestAnimationFrame(() => {
    const footer = document.querySelector('footer');
    const overlay = document.querySelector('.overlay');
    const nav = document.querySelector('nav');

    document.documentElement.style.setProperty('--overlay-height', `calc(${footer.offsetHeight}px + 3.5rem)`);
    document.documentElement.style.setProperty('--chat-bottom-margin', `${overlay.offsetHeight}px`);
    document.documentElement.style.setProperty('--chat-top-margin', `${nav.offsetHeight}px`);
  });
}

document.addEventListener('DOMContentLoaded', getMeasurements);
window.addEventListener('resize', getMeasurements);

if (Math.random() < 0.001) {
  document.body.classList.add('type-2');
}
