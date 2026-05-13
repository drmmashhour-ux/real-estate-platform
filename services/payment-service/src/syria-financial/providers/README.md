# Syria Providers Module

Provider abstraction for future Syrian payment integrations.

- Exposes `createPaymentIntent`, `verifyPayment`, `createPayout`, `handleWebhook`, and `healthCheck`.
- Includes `provider_stub`, `provider_qnb_stub`, and `provider_chamcash_stub`.
- QNB Syria and Cham Cash stubs are feature-flag protected and disabled by default.
- No provider opens sockets, stores secrets, connects banking APIs, or executes money movement.
