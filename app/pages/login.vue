<script setup lang="ts">
import LogoLink from '@/components/LogoLink.vue'
import Container from '@/components/Container.vue'
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { LogIn } from '@lucide/vue'

definePageMeta({
    layout: 'default',
})

const { fetch: refreshSession } = useUserSession()
const isSubmitting = ref(false)
const serverError = ref<string | null>(null)

type LoginForm = {
    username: string,
    password: string,
};

const formValues = reactive<LoginForm>({
    username: '',
    password: '',
})

const resolver = zodResolver(
    z.object({
        username: z.string().min(1, { message: 'Username is required' }),
        password: z.string().min(1, { message: 'Password is required' }),
    })
)

async function submitLogin(event: FormSubmitEvent) {
    if (!event.valid || isSubmitting.value) {
        return
    }

    const formData = event.values as LoginForm
    isSubmitting.value = true
    serverError.value = null

    try {
        await $fetch('/api/login', {
            method: 'POST',
            body: formData,
        })

        await refreshSession()
        await navigateTo('/dashboard')
    } catch (err: any) {
        serverError.value = err?.data?.statusMessage || err?.data?.message || err?.statusMessage || err?.message || 'Login failed'
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <Container class="min-h-svh flex flex-col justify-center items-center">
        <div class="mb-6">
            <LogoLink img-classes="h-8! lg:h-10!" />
        </div>
        <div class="w-full sm:max-w-md">
            <Card
                pt:caption:class="space-y-2"
                pt:body:class="space-y-6"
            >
                <template #title>
                    <div class="text-center">
                        Sign In
                    </div>
                </template>
                <template #subtitle>
                    <div class="text-center">
                        Enter your credentials to access the manager
                    </div>
                </template>
                <template #content>
                    <Form
                        v-slot="$form"
                        class="space-y-6"
                        :initialValues="formValues"
                        :resolver
                        @submit="submitLogin"
                    >
                        <div class="flex flex-col gap-2">
                            <label for="username">Username</label>
                            <InputText
                                id="username"
                                name="username"
                                placeholder="Username"
                                type="text"
                                autocomplete="username"
                                autofocus
                                fluid
                            />
                            <Message
                                v-if="$form.username?.invalid"
                                severity="error"
                                size="small"
                                variant="simple"
                            >
                                {{ $form.username.error.message }}
                            </Message>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="password">Password</label>
                            <Password
                                :feedback="false"
                                inputId="password"
                                name="password"
                                placeholder="Password"
                                toggleMask
                                fluid
                                :invalid="!!serverError || $form.password?.invalid"
                                :pt="{ input: { root: { autocomplete: 'current-password' } } }"
                            />
                            <Message
                                v-if="$form.password?.invalid"
                                severity="error"
                                size="small"
                                variant="simple"
                            >
                                {{ $form.password.error.message }}
                            </Message>
                            <Message
                                v-if="serverError"
                                severity="error"
                                size="small"
                                variant="simple"
                            >
                                {{ serverError }}
                            </Message>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                :loading="isSubmitting"
                                :disabled="isSubmitting"
                                label="Sign In"
                                fluid
                            >
                                <template #icon>
                                    <LogIn />
                                </template>
                            </Button>
                        </div>
                    </Form>
                </template>
            </Card>
        </div>
    </Container>
</template>
