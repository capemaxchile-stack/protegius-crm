export interface PlantillaCorreo {
  id: string;
  nombre: string;
  asunto: string;
  cuerpo: string;
  descripcion: string;
}

export const PLANTILLAS_CORREO_DEFAULT: PlantillaCorreo[] = [
  {
    id: "presentacion",
    nombre: "Presentación de Servicios Protegius",
    asunto: "Presentación de Soluciones Corporativas — Protegius & {{razonSocial}}",
    descripcion: "Presentación inicial de servicios, plataforma de monitoreo y soporte.",
    cuerpo: `<p>Estimado/a <strong>{{contacto}}</strong>,</p>

<p>Junto con saludar, te escribo en representación de <strong>Protegius</strong> para compartir contigo información detallada sobre nuestras soluciones de monitoreo y gestión comercial diseñadas para potenciar la operación de <strong>{{razonSocial}}</strong>.</p>

<p>En Protegius nos especializamos en brindar herramientas de alta disponibilidad y soporte continuo que optimizan el rendimiento y la seguridad operativa de nuestros clientes.</p>

<p>Quedo a tu entera disposición para coordinar una breve reunión demostrativa o resolver cualquier inquietud.</p>

<p>Saludos cordiales,</p>

<p>--<br>
<strong>{{ejecutivoNombre}}</strong><br>
{{ejecutivoCargo}}<br>
Protegius<br>
✉️ {{ejecutivoEmail}}<br>
📞 {{ejecutivoTelefono}}</p>`,
  },
  {
    id: "cotizacion",
    nombre: "Envío de Cotización / Propuesta en UF",
    asunto: "Propuesta Comercial Protegius — {{razonSocial}}",
    descripcion: "Envío formal de propuesta comercial en UF con detalle de planes.",
    cuerpo: `<p>Estimado/a <strong>{{contacto}}</strong>,</p>

<p>Es un gusto saludarte. En seguimiento a nuestras conversaciones, adjunto y detallo la propuesta comercial formal preparada especialmente para <strong>{{razonSocial}}</strong>.</p>

<p>Nuestra propuesta incluye las condiciones de servicio, valores en UF garantizados y los plazos de activación para asegurar un inicio ágil y sin fricciones.</p>

<p>Puedes revisar los antecedentes y hacerme llegar cualquier consulta sobre los planes y opciones de implementación.</p>

<p>Atentamente,</p>

<p>--<br>
<strong>{{ejecutivoNombre}}</strong><br>
{{ejecutivoCargo}}<br>
Protegius<br>
✉️ {{ejecutivoEmail}}<br>
📞 {{ejecutivoTelefono}}</p>`,
  },
  {
    id: "reunion",
    nombre: "Coordinación / Minuta de Reunión",
    asunto: "Coordinación de Reunión Comercial — Protegius y {{razonSocial}}",
    descripcion: "Confirmación de fecha, hora o acuerdos de reunión comercial.",
    cuerpo: `<p>Hola <strong>{{contacto}}</strong>,</p>

<p>Agradeciendo de antemano tu tiempo, te escribo para confirmar los detalles de nuestra reunión comercial agendada.</p>

<p>El objetivo de la sesión será revisar en detalle los requerimientos de <strong>{{razonSocial}}</strong> y definir el alcance de los servicios que mejor se adapten a sus necesidades.</p>

<p>Si requieres sumar a más personas del equipo o necesitas reprogramar la sesión, no dudes en avisarme.</p>

<p>Saludos cordiales,</p>

<p>--<br>
<strong>{{ejecutivoNombre}}</strong><br>
{{ejecutivoCargo}}<br>
Protegius<br>
✉️ {{ejecutivoEmail}}<br>
📞 {{ejecutivoTelefono}}</p>`,
  },
  {
    id: "seguimiento",
    nombre: "Seguimiento Comercial",
    asunto: "Seguimiento a Propuesta Protegius — {{razonSocial}}",
    descripcion: "Seguimiento periódico a propuestas enviadas o conversaciones previas.",
    cuerpo: `<p>Estimado/a <strong>{{contacto}}</strong>,</p>

<p>Espero que estés teniendo una excelente semana. Te escribo para hacer un breve seguimiento respecto a la propuesta enviada recientemente a <strong>{{razonSocial}}</strong>.</p>

<p>¿Pudieron revisar los antecedentes con el equipo? Me gustaría saber si tienen alguna consulta o si podemos agendar una llamada rápida para aclarar dudas.</p>

<p>Quedo atento a tus comentarios.</p>

<p>Saludos cordiales,</p>

<p>--<br>
<strong>{{ejecutivoNombre}}</strong><br>
{{ejecutivoCargo}}<br>
Protegius<br>
✉️ {{ejecutivoEmail}}<br>
📞 {{ejecutivoTelefono}}</p>`,
  },
];
