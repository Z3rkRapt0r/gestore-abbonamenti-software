
interface EmailTemplate {
  template_type: 'documenti' | 'notifiche' | 'approvazioni' | 'generale' | 'permessi-richiesta' | 'permessi-approvazione' | 'permessi-rifiuto';
  name: string;
  subject: string;
  content: string;
  details?: string;
  show_details_button?: boolean;
  show_leave_details?: boolean;
  show_admin_notes?: boolean;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  logo_url?: string;
  logo_alignment: 'left' | 'center' | 'right';
  logo_size: 'small' | 'medium' | 'large';
  footer_text: string;
  footer_color: string;
  header_alignment: 'left' | 'center' | 'right';
  body_alignment: 'left' | 'center' | 'right' | 'justify';
  font_family: string;
  font_size: 'small' | 'medium' | 'large';
  button_color: string;
  button_text_color: string;
  border_radius: string;
  admin_notes_bg_color?: string;
  admin_notes_text_color?: string;
  leave_details_bg_color?: string;
  leave_details_text_color?: string;
  show_custom_block?: boolean;
  custom_block_text?: string;
  custom_block_bg_color?: string;
  custom_block_text_color?: string;
  text_alignment?: 'left' | 'center' | 'right' | 'justify';
}

interface EmailTemplatePreviewProps {
  subject: string;
  content: string;
  templateData: {
    primary_color: string;
    secondary_color: string;
    background_color: string;
    text_color: string;
    font_family: string;
    font_size: string;
    border_radius: string;
    footer_text: string;
    footer_color: string;
    show_details_button: boolean;
    show_leave_details: boolean;
    show_admin_notes: boolean;
    show_custom_block: boolean;
    custom_block_text: string;
    custom_block_bg_color: string;
    custom_block_text_color: string;
    leave_details_bg_color: string;
    leave_details_text_color: string;
    admin_notes_bg_color: string;
    admin_notes_text_color: string;
    button_color: string;
    button_text_color: string;
    text_alignment: string;
  };
  templateType?: string;
}

const EmailTemplatePreview = ({ subject, content, templateData, templateType }: EmailTemplatePreviewProps) => {
  // Create a template object from the props
  const template: EmailTemplate = {
    template_type: (templateType as any) || 'generale',
    name: '',
    subject,
    content,
    show_details_button: templateData.show_details_button,
    show_leave_details: templateData.show_leave_details,
    show_admin_notes: templateData.show_admin_notes,
    primary_color: templateData.primary_color,
    secondary_color: templateData.secondary_color,
    background_color: templateData.background_color,
    text_color: templateData.text_color,
    logo_alignment: 'center',
    logo_size: 'medium',
    footer_text: templateData.footer_text,
    footer_color: templateData.footer_color,
    header_alignment: 'left',
    body_alignment: (templateData.text_alignment as any) || 'left',
    font_family: templateData.font_family,
    font_size: (templateData.font_size as any) || 'medium',
    button_color: templateData.button_color,
    button_text_color: templateData.button_text_color,
    border_radius: templateData.border_radius,
    admin_notes_bg_color: templateData.admin_notes_bg_color,
    admin_notes_text_color: templateData.admin_notes_text_color,
    leave_details_bg_color: templateData.leave_details_bg_color,
    leave_details_text_color: templateData.leave_details_text_color,
    show_custom_block: templateData.show_custom_block,
    custom_block_text: templateData.custom_block_text,
    custom_block_bg_color: templateData.custom_block_bg_color,
    custom_block_text_color: templateData.custom_block_text_color,
    text_alignment: (templateData.text_alignment as any) || 'left',
  };

  const getLogoSize = () => {
    switch (template.logo_size) {
      case 'small': return '40px';
      case 'medium': return '60px';
      case 'large': return '80px';
      default: return '60px';
    }
  };

  const getFontSize = () => {
    switch (template.font_size) {
      case 'small': return '14px';
      case 'medium': return '16px';
      case 'large': return '18px';
      default: return '16px';
    }
  };

  const getRealisticContent = () => {
    switch (template.template_type) {
      case 'documenti':
        return {
          content: 'Gentile Mario Rossi,\n\nÈ disponibile un nuovo documento per la tua revisione. Il documento "Contratto 2025" contiene informazioni importanti che richiedono la tua attenzione immediata.\n\nTi preghiamo di accedere alla dashboard per visualizzare e scaricare il documento.',
          details: 'Documento: Contratto 2025\nCaricato da: Amministratore\nData: 16 Giugno 2025',
          adminNotes: ''
        };
      case 'notifiche':
        return {
          content: 'Gentile Mario Rossi,\n\nHai ricevuto una nuova notifica importante dal sistema aziendale. Ti invitiamo a prenderne visione accedendo alla tua dashboard personale.\n\nLa notifica riguarda aggiornamenti sulla policy aziendale.',
          details: 'Tipo: Aggiornamento policy\nPriorità: Alta\nData: 16 Giugno 2025',
          adminNotes: ''
        };
      case 'approvazioni':
        return {
          content: 'Gentile Amministratore,\n\nÈ necessaria la tua approvazione per una richiesta di Mario Rossi. La richiesta riguarda l\'autorizzazione per l\'accesso a documenti riservati.\n\nAccedi alla dashboard per visualizzare i dettagli e procedere con l\'approvazione o il rifiuto.',
          details: 'Richiesta: Accesso documenti riservati\nRichiedente: Mario Rossi\nData richiesta: 16 Giugno 2025',
          adminNotes: ''
        };
      case 'permessi-richiesta':
        return {
          content: template.content || 'Gentile Amministratore,\n\nMario Rossi ha inviato una nuova richiesta di permesso. Ti preghiamo di prenderne visione e procedere con l\'approvazione o il rifiuto.',
          details: 'Tipo: Permesso\nDal: 2025-06-29\nAl: 2025-07-01\nMotivo: Visita medica',
          adminNotes: ''
        };
      case 'permessi-approvazione':
        return {
          content: template.content || 'Gentile Mario Rossi,\n\nLa tua richiesta di permesso/ferie è stata approvata dall\'amministratore.',
          details: 'Tipo: Permesso\nDal: 2025-06-29\nAl: 2025-07-01\nMotivo: Visita medica',
          adminNotes: 'Note amministratore: Richiesta approvata. Ricorda di recuperare le ore.'
        };
      case 'permessi-rifiuto':
        return {
          content: template.content || 'Gentile Mario Rossi,\n\nLa tua richiesta di permesso/ferie è stata rifiutata dall\'amministratore.',
          details: 'Tipo: Permesso\nDal: 2025-06-29\nAl: 2025-07-01\nMotivo: Visita medica',
          adminNotes: 'Note amministratore: Impossibile concedere il permesso per esigenze di servizio. Riprova per un\'altra data.'
        };
      default:
        return {
          content: 'Gentile utente,\n\nQuesto è un messaggio di esempio dal sistema di gestione aziendale. Il contenuto verrà personalizzato in base al tipo di notifica.',
          details: '',
          adminNotes: ''
        };
    }
  };

  const getActionButton = () => {
    switch (template.template_type) {
      case 'documenti':
        return 'Visualizza Documento';
      case 'notifiche':
        return 'Visualizza';
      case 'approvazioni':
        return 'Gestisci Richiesta';
      case 'permessi-richiesta':
        return 'Gestisci Richiesta';
      case 'permessi-approvazione':
        return 'Visualizza Dettagli';
      case 'permessi-rifiuto':
        return 'Visualizza Dettagli';
      default:
        return 'Visualizza';
    }
  };

  const shouldShowButton = () => {
    return template.show_details_button !== false;
  };

  const shouldShowLeaveDetails = () => {
    const isLeaveTemplate = ['permessi-richiesta', 'permessi-approvazione', 'permessi-rifiuto'].includes(template.template_type);
    return isLeaveTemplate && template.show_leave_details !== false;
  };

  const shouldShowAdminNotes = () => {
    const isAdminActionTemplate = ['permessi-approvazione', 'permessi-rifiuto'].includes(template.template_type);
    return isAdminActionTemplate && template.show_admin_notes !== false;
  };

  const shouldShowCustomBlock = () => {
    return template.template_type === 'notifiche' && template.show_custom_block === true && template.custom_block_text;
  };

  const { content: displayContent, details, adminNotes } = getRealisticContent();

  return (
    <div className="border rounded-lg p-4 bg-gray-50 max-h-[600px] overflow-auto">
      <div 
        style={{
          fontFamily: template.font_family,
          fontSize: getFontSize(),
          backgroundColor: template.background_color,
          color: template.text_color,
          maxWidth: '600px',
          margin: '0 auto',
          padding: '32px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        {template.logo_url && (
          <div style={{ textAlign: template.logo_alignment, marginBottom: '24px' }}>
            <img 
              src={template.logo_url} 
              alt="Logo" 
              style={{ 
                maxHeight: getLogoSize(),
                maxWidth: '200px',
                objectFit: 'contain'
              }}
            />
          </div>
        )}

        <div style={{ textAlign: template.header_alignment, marginBottom: '24px' }}>
          <h2 style={{ 
            color: template.primary_color, 
            margin: '0 0 16px 0',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {template.subject}
          </h2>
        </div>

        <div style={{ 
          textAlign: template.body_alignment,
          lineHeight: '1.6',
          marginBottom: '24px'
        }}>
          {shouldShowCustomBlock() && (
            <div style={{ 
              backgroundColor: template.custom_block_bg_color || '#fff3cd',
              color: template.custom_block_text_color || '#856404',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px',
              whiteSpace: 'pre-line',
              borderLeft: `3px solid ${template.custom_block_text_color || '#856404'}`
            }}>
              <strong>Informazioni:</strong><br/>
              {template.custom_block_text}
            </div>
          )}

          <div style={{ margin: '0 0 16px 0', whiteSpace: 'pre-line' }}>
            {displayContent}
          </div>
          
          {shouldShowLeaveDetails() && details && (
            <div style={{ 
              backgroundColor: template.leave_details_bg_color || '#e3f2fd',
              color: template.leave_details_text_color || '#1565c0',
              padding: '12px',
              borderRadius: '6px',
              marginTop: '16px',
              fontSize: '14px',
              whiteSpace: 'pre-line'
            }}>
              <strong>Dettagli richiesta:</strong><br/>
              {details}
            </div>
          )}

          {shouldShowAdminNotes() && adminNotes && (
            <div style={{ 
              backgroundColor: template.admin_notes_bg_color || '#f8f9fa',
              color: template.admin_notes_text_color || '#495057',
              padding: '12px',
              borderRadius: '6px',
              marginTop: '16px',
              fontSize: '14px',
              whiteSpace: 'pre-line',
              borderLeft: `3px solid ${template.admin_notes_text_color || '#495057'}`
            }}>
              <strong>Note amministratore:</strong><br/>
              {adminNotes}
            </div>
          )}
        </div>

        {shouldShowButton() && (
          <div style={{ textAlign: 'center', margin: '32px 0' }}>
            <a 
              href="#" 
              style={{
                backgroundColor: template.button_color,
                color: template.button_text_color,
                padding: '12px 24px',
                borderRadius: template.border_radius,
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {getActionButton()}
            </a>
          </div>
        )}

        <div style={{ 
          borderTop: `1px solid ${template.secondary_color}20`,
          paddingTop: '24px',
          marginTop: '32px',
          textAlign: 'center'
        }}>
          <p style={{ 
            color: template.footer_color,
            fontSize: '13px',
            margin: '0',
            lineHeight: '1.4'
          }}>
            {template.footer_text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatePreview;
