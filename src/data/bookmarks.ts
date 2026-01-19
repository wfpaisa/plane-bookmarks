// Simulación de datos de la base de datos
export interface BookmarkData {
  key: string;
  title: string;
  nombre: string;
  fechaCreacion: string;
  icono: string;
  tags: string[];
  link?: string;
  children?: BookmarkData[];
}

export const bookmarksData: BookmarkData[] = [
  {
    key: "0-0",
    title: "🚀 Desarrollo Frontend",
    nombre: "Desarrollo Frontend",
    fechaCreacion: "2024-01-15T10:30:00Z",
    icono: "🚀",
    tags: ["frontend", "desarrollo"],
    children: [
      {
        key: "0-0-0",
        title: "⚛️ React",
        nombre: "React",
        link: "https://react.dev",
        fechaCreacion: "2024-04-05T16:20:00Z",
        icono: "⚛️",
        tags: ["react", "documentación", "frontend"],
      },
      {
        key: "0-0-1",
        title: "📘 TypeScript",
        nombre: "TypeScript",
        link: "https://www.typescriptlang.org/docs",
        fechaCreacion: "2024-05-12T11:00:00Z",
        icono: "📘",
        tags: ["typescript", "documentación", "tipos"],
      },
      {
        key: "0-0-2",
        title: "🎨 Estilos",
        nombre: "Estilos",
        fechaCreacion: "2024-06-18T13:30:00Z",
        icono: "🎨",
        tags: ["css", "diseño"],
        children: [
          {
            key: "0-0-2-0",
            title: "🌊 Tailwind CSS",
            nombre: "Tailwind CSS",
            link: "https://tailwindcss.com",
            fechaCreacion: "2024-09-14T10:25:00Z",
            icono: "🌊",
            tags: ["css", "framework", "diseño"],
          },
          {
            key: "0-0-2-1",
            title: "📝 CSS Tricks",
            nombre: "CSS Tricks",
            link: "https://css-tricks.com",
            fechaCreacion: "2024-06-18T13:30:00Z",
            icono: "📝",
            tags: ["css", "diseño", "frontend"],
          },
        ],
      },
    ],
  },
  {
    key: "0-1",
    title: "🔧 Herramientas",
    nombre: "Herramientas",
    fechaCreacion: "2024-02-20T14:45:00Z",
    icono: "🔧",
    tags: ["herramientas", "desarrollo"],
    children: [
      {
        key: "0-1-0",
        title: "🐙 GitHub",
        nombre: "GitHub",
        link: "https://github.com",
        fechaCreacion: "2024-01-15T10:30:00Z",
        icono: "🐙",
        tags: ["desarrollo", "código", "git"],
      },
      {
        key: "0-1-1",
        title: "📦 npm",
        nombre: "npm",
        link: "https://www.npmjs.com",
        fechaCreacion: "2024-10-08T12:50:00Z",
        icono: "📦",
        tags: ["paquetes", "nodejs", "dependencias"],
      },
      {
        key: "0-1-2",
        title: "▲ Vercel",
        nombre: "Vercel",
        link: "https://vercel.com",
        fechaCreacion: "2024-08-30T15:10:00Z",
        icono: "▲",
        tags: ["deploy", "hosting", "frontend"],
      },
    ],
  },
  {
    key: "0-2",
    title: "📚 Documentación",
    nombre: "Documentación",
    fechaCreacion: "2024-03-10T09:15:00Z",
    icono: "📚",
    tags: ["documentación", "referencias"],
    children: [
      {
        key: "0-2-0",
        title: "📖 MDN Web Docs",
        nombre: "MDN Web Docs",
        link: "https://developer.mozilla.org",
        fechaCreacion: "2024-03-10T09:15:00Z",
        icono: "📖",
        tags: ["documentación", "web", "javascript"],
      },
      {
        key: "0-2-1",
        title: "💡 Stack Overflow",
        nombre: "Stack Overflow",
        link: "https://stackoverflow.com",
        fechaCreacion: "2024-02-20T14:45:00Z",
        icono: "💡",
        tags: ["desarrollo", "ayuda", "programación"],
      },
    ],
  },
  {
    key: "0-3",
    title: "💻 Comunidad",
    nombre: "Comunidad",
    link: "https://dev.to",
    fechaCreacion: "2024-07-22T08:45:00Z",
    icono: "💻",
    tags: ["comunidad", "blog", "desarrollo"],
  },
];
