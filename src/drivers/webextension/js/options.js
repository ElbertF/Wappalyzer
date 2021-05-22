'use strict'
/* eslint-env browser */
/* globals Utils, chrome */

const { agent, i18n, getOption, setOption } = Utils

const Options = {
  /**
   * Initialise options
   */
  async init() {
    const termsAccepted =
      agent === 'chrome' || (await getOption('termsAccepted', false))

    ;[
      ['upgradeMessage', true],
      ['dynamicIcon', false],
      ['badge', true],
      ['tracking', true],
    ].map(async ([option, defaultValue]) => {
      const el = document
        .querySelector(
          `[data-i18n="option${
            option.charAt(0).toUpperCase() + option.slice(1)
          }"]`
        )
        .parentNode.querySelector('input')

      el.checked =
        !!(await getOption(option, defaultValue)) &&
        (option !== 'tracking' || termsAccepted)

      el.addEventListener('click', async () => {
        await setOption(option, !!el.checked)
      })
    })

    document
      .querySelector('.options__cache')
      .addEventListener('click', () => Options.driver('clearCache'))

    i18n()
  },

  driver(func, args, callback) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          source: 'content.js',
          func,
          args: args ? (Array.isArray(args) ? args : [args]) : [],
        },
        (response) => {
          chrome.runtime.lastError
            ? reject(new Error(chrome.runtime.lastError.message))
            : resolve(response)
        }
      )
    })
  },
}

if (/complete|interactive|loaded/.test(document.readyState)) {
  Options.init()
} else {
  document.addEventListener('DOMContentLoaded', Options.init)
}
