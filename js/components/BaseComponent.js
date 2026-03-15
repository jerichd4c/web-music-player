export class BaseComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.init();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                /* Estilos aislados del componente */
                :host {
                    display: block;
                }
            </style>
            <div class="component-container">
                </div>
        `;
    }

    init() {
    }

    disconnectedCallback() { 
    }
}