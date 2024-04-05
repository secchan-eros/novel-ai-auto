import ConfirmationService from 'primevue/confirmationservice'

export default defineNuxtPlugin(({ vueApp }) => {
  vueApp.use(ConfirmationService)
})
