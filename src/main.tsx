import {attachComponent  } from 'veles'

const container = document.getElementById('app')

function App() {
    return <><p>{'Hello world'}</p><Component /></>
}

function Component() {
    return (
        <ul>
            <li>123</li>
            <li>456</li>
            <li>789</li>
            <li>098</li>
        </ul>
    )
}

if (container) {
    attachComponent({
        htmlElement: container,
        component: <App />
    })
}