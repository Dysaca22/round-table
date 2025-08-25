const translations = {
    en: {
        app: {
            title: "AI Giants' Round Table",
        },
        settings: {
            title: "Debate Configuration",
            subtitle: "Set up the topic, time, and participants for the round table.",
            aiProvider: {
                title: "AI Provider Configuration",
                apiKeyPlaceholder: "Enter your Google Gemini API Key",
                apiKeyRequired: "API Key required for Gemini",
                lmStudioWarning: "Note: Performance depends on your local hardware and model. Please enable 'Cross-Origin Resource Sharing (CORS)' in Server Options and test the connection.",
                portLabel: "Server Port",
                testConnection: "Test Connection",
                testing: "Testing...",
                testSuccess: "Connection successful!",
                testError: "Connection failed. Check server & CORS.",
            },
            language: {
                label: "Language",
            },
            topic: {
                label: "Debate Topic",
            },
            timeLimit: {
                label: "Time Limit (minutes)",
            },
            thinkingTime: {
                label: "Thinking Time (seconds)",
            },
            participants: {
                title: "Participants",
                add: "Add Participant",
                edit: "Edit",
                remove: "Remove",
            },
            startDebate: "Start Debate",
            needMembers: "Need at least 2 members",
            modal: {
                title: (name: string) => `Edit ${name}`,
                name: "Name",
                avatar: "Avatar (2 letters)",
                persona: "Persona",
                done: "Done",
            }
        },
        participantList: {
            title: "Participants",
        },
        controls: {
            pause: "Pause",
            resume: "Resume",
            backToSettings: "Back to Settings",
            restart: "Restart Debate",
            exportDebate: "Export Debate as .txt",
        },
        status: {
            configure: "Configure the debate and press start.",
            starting: "The Moderator is starting the debate...",
            errorStarting: "Error starting debate.",
            concludedMaxTurns: "Debate concluded after reaching the maximum number of turns.",
            concludedTimeUp: "Debate concluded: Time is up.",
            waitingFor: (name: string) => `Waiting for ${name}'s contribution...`,
            moderatorDeciding: "Moderator is deciding the next turn...",
            errorDuring: "Error during debate.",
            paused: "Debate is paused.",
            resuming: (name: string) => `Resuming debate... Next up is ${name}.`,
        },
        errors: {
            unknown: "An unknown error occurred.",
            startFailed: "Failed to start debate",
            speakerNotFound: "Error: Current speaker not found.",
            invalidSpeaker: (id: string) => `Moderator selected an invalid next speaker ID: ${id}`,
            general: "An error occurred",
        }
    },
    es: {
        app: {
            title: "La Mesa Redonda de los Gigantes de IA",
        },
        settings: {
            title: "Configuración del Debate",
            subtitle: "Define el tema, el tiempo y los participantes para la mesa redonda.",
            aiProvider: {
                title: "Configuración del Proveedor de IA",
                apiKeyPlaceholder: "Introduce tu clave de API de Google Gemini",
                apiKeyRequired: "Se requiere clave de API para Gemini",
                lmStudioWarning: "Nota: El rendimiento depende de tu hardware y modelo local. Por favor, habilita 'Cross-Origin Resource Sharing (CORS)' en las Opciones del Servidor y prueba la conexión.",
                portLabel: "Puerto del Servidor",
                testConnection: "Probar Conexión",
                testing: "Probando...",
                testSuccess: "¡Conexión exitosa!",
                testError: "Falló la conexión. Revisa el servidor y CORS.",
            },
            language: {
                label: "Idioma",
            },
            topic: {
                label: "Tema del Debate",
            },
            timeLimit: {
                label: "Límite de Tiempo (minutos)",
            },
            thinkingTime: {
                label: "Tiempo de Reflexión (segundos)",
            },
            participants: {
                title: "Participantes",
                add: "Añadir Participante",
                edit: "Editar",
                remove: "Eliminar",
            },
            startDebate: "Iniciar Debate",
            needMembers: "Se necesitan al menos 2 miembros",
            modal: {
                title: (name: string) => `Editar a ${name}`,
                name: "Nombre",
                avatar: "Avatar (2 letras)",
                persona: "Personalidad",
                done: "Hecho",
            }
        },
        participantList: {
            title: "Participantes",
        },
        controls: {
            pause: "Pausar",
            resume: "Reanudar",
            backToSettings: "Volver a Configuración",
            restart: "Reiniciar Debate",
            exportDebate: "Exportar Debate como .txt",
        },
        status: {
            configure: "Configura el debate y presiona iniciar.",
            starting: "El Moderador está iniciando el debate...",
            errorStarting: "Error al iniciar el debate.",
            concludedMaxTurns: "Debate concluido al alcanzar el número máximo de turnos.",
            concludedTimeUp: "Debate concluido: Se acabó el tiempo.",
            waitingFor: (name: string) => `Esperando la contribución de ${name}...`,
            moderatorDeciding: "El Moderador está decidiendo el próximo turno...",
            errorDuring: "Error durante el debate.",
            paused: "Debate en pausa.",
            resuming: (name: string) => `Reanudando el debate... El turno es de ${name}.`,
        },
        errors: {
            unknown: "Ocurrió un error desconocido.",
            startFailed: "No se pudo iniciar el debate",
            speakerNotFound: "Error: No se encontró al ponente actual.",
            invalidSpeaker: (id: string) => `El moderador seleccionó un ID de ponente inválido: ${id}`,
            general: "Ocurrió un error",
        }
    }
};

export type Language = keyof typeof translations;
export type TranslationSet = typeof translations['en'];

export const T = (lang: Language): TranslationSet => translations[lang];