import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildHtmlContent, buildAttachmentSection } from "./mailTemplates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[Notification Email] Starting email function");

  try {
    const body = await req.json();
    console.log("[Notification Email] Request body:", JSON.stringify(body, null, 2));

    const { recipientId, subject, shortText, userId, topic, body: emailBody, adminNote, employeeEmail, employeeName, employeeNote, adminMessage } = body;

    // ENHANCED: Log employee note specifically
    console.log("[Notification Email] Employee note received:", employeeNote);
    console.log("[Notification Email] Employee email received:", employeeEmail);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Improved admin identification logic
    let adminSettingsUserId = userId;
    
    // If no userId provided or if we need to find an admin with Brevo settings
    if (!userId || !adminSettingsUserId) {
      console.log("[Notification Email] No userId provided, searching for admin with Brevo settings");
      
      const { data: adminWithBrevo, error: adminSearchError } = await supabase
        .from("admin_settings")
        .select("admin_id, brevo_api_key")
        .not("brevo_api_key", "is", null)
        .limit(1)
        .single();

      if (!adminSearchError && adminWithBrevo) {
        adminSettingsUserId = adminWithBrevo.admin_id;
        console.log("[Notification Email] Found admin with Brevo settings:", adminSettingsUserId);
      } else {
        console.error("[Notification Email] No admin with Brevo settings found:", adminSearchError);
      }
    }

    if (!adminSettingsUserId) {
      console.error("[Notification Email] No valid admin ID found for Brevo settings");
      return new Response(
        JSON.stringify({ error: "No admin with Brevo configuration found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Notification Email] Using admin ID for settings:", adminSettingsUserId);

    // Get Brevo settings for admin including sender configuration and global logo
    const { data: adminSetting, error: settingsError } = await supabase
      .from("admin_settings")
      .select("brevo_api_key, sender_name, sender_email, reply_to, global_logo_url, global_logo_alignment, global_logo_size")
      .eq("admin_id", adminSettingsUserId)
      .single();

    if (settingsError) {
      console.error("[Notification Email] Error fetching admin settings:", settingsError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch admin settings", 
          details: settingsError.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!adminSetting?.brevo_api_key) {
      console.error("[Notification Email] No Brevo API key found for admin:", adminSettingsUserId);
      return new Response(
        JSON.stringify({ 
          error: "No Brevo API key configured for this admin" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Notification Email] Found Brevo settings for admin");

    // FIXED: ENHANCED TEMPLATE TYPE MAPPING - Corrected logic for notification categories
    let templateType = 'notifiche'; // default
    let templateCategory = 'generale'; // default
    
    if (topic === 'document' || topic === 'documents') {
      templateType = 'documenti';
      templateCategory = employeeEmail ? 'dipendenti' : 'amministratori';
    } else if (topic === 'approvals' || topic === 'approval') {
      templateType = 'approvazioni';
      templateCategory = 'amministratori';
    } else if (topic === 'notifications' || topic === 'notification') {
      templateType = 'notifiche';
      // FIXED: Correct logic for notifications
      // When employeeEmail is present: employee is sending to admin → use 'dipendenti' template
      // When employeeEmail is NOT present: admin is sending to employees → use 'amministratori' template
      templateCategory = employeeEmail ? 'dipendenti' : 'amministratori';
    } else if (topic === 'permessi-richiesta') {
      templateType = 'permessi-richiesta';
      templateCategory = 'dipendenti';
    } else if (topic === 'ferie-richiesta') {
      templateType = 'ferie-richiesta';
      templateCategory = 'dipendenti';
    } else if (topic === 'permessi-approvazione') {
      templateType = 'permessi-approvazione';
      templateCategory = 'amministratori';
    } else if (topic === 'ferie-approvazione') {
      templateType = 'ferie-approvazione';
      templateCategory = 'amministratori';
    } else if (topic === 'permessi-rifiuto') {
      templateType = 'permessi-rifiuto';
      templateCategory = 'amministratori';
    } else if (topic === 'ferie-rifiuto') {
      templateType = 'ferie-rifiuto';
      templateCategory = 'amministratori';
    } else {
      // Enhanced fallback to subject analysis if topic is not clear
      const lowerSubject = subject?.toLowerCase() || '';
      if (lowerSubject.includes('documento') || lowerSubject.includes('document')) {
        templateType = 'documenti';
        templateCategory = employeeEmail ? 'dipendenti' : 'amministratori';
      } else if (lowerSubject.includes('approv')) {
        templateType = 'approvazioni';
        templateCategory = 'amministratori';
      } else if (lowerSubject.includes('permesso')) {
        if (lowerSubject.includes('approvata') || lowerSubject.includes('approvato')) {
          templateType = 'permessi-approvazione';
          templateCategory = 'amministratori';
        } else if (lowerSubject.includes('rifiutata') || lowerSubject.includes('rifiutato')) {
          templateType = 'permessi-rifiuto';
          templateCategory = 'amministratori';
        } else {
          templateType = 'permessi-richiesta';
          templateCategory = 'dipendenti';
        }
      } else if (lowerSubject.includes('ferie')) {
        if (lowerSubject.includes('approvata') || lowerSubject.includes('approvato')) {
          templateType = 'ferie-approvazione';
          templateCategory = 'amministratori';
        } else if (lowerSubject.includes('rifiutata') || lowerSubject.includes('rifiutato')) {
          templateType = 'ferie-rifiuto';
          templateCategory = 'amministratori';
        } else {
          templateType = 'ferie-richiesta';
          templateCategory = 'dipendenti';
        }
      } else {
        // FIXED: For generic notifications, use correct logic
        templateType = 'notifiche';
        templateCategory = employeeEmail ? 'dipendenti' : 'amministratori';
      }
    }

    console.log("[Notification Email] FIXED Template mapping - Type:", templateType, "Category:", templateCategory, "Topic:", topic);
    console.log("[Notification Email] EmployeeEmail present:", !!employeeEmail, "- This determines notification category");

    // FIXED: Check if this is an admin notification template (should use dynamic content)
    const isAdminNotificationTemplate = templateType === 'notifiche' && templateCategory === 'amministratori';

    // Get email template for the specific template type and category
    console.log("[Notification Email] Looking for email template:", templateType, templateCategory);
    const { data: emailTemplate, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("admin_id", adminSettingsUserId)
      .eq("template_type", templateType)
      .eq("template_category", templateCategory)
      .maybeSingle();

    if (templateError) {
      console.error("[Notification Email] Error fetching email template:", templateError);
    }

    console.log("[Notification Email] Template query result:", emailTemplate ? "Found custom template" : "No custom template found");
    console.log("[Notification Email] Is admin notification template (uses dynamic content):", isAdminNotificationTemplate);
    
    // ENHANCED LOGGING FOR ADMIN MESSAGE DEBUGGING
    if (emailTemplate) {
      console.log("[Notification Email] Template show_admin_message:", emailTemplate.show_admin_message);
      console.log("[Notification Email] Template admin_message_bg_color:", emailTemplate.admin_message_bg_color);
      console.log("[Notification Email] Template admin_message_text_color:", emailTemplate.admin_message_text_color);
      console.log("[Notification Email] Template button config - show_button:", emailTemplate.show_button);
      console.log("[Notification Email] Template button config - button_text:", emailTemplate.button_text);
      console.log("[Notification Email] Template button config - button_url:", emailTemplate.button_url);
    }

    // Template data handling - prioritize database template or use minimal fallback
    let templateData;
    if (emailTemplate) {
      templateData = emailTemplate;
      console.log("[Notification Email] Using custom template from database");
    } else {
      // Minimal fallback template with basic styling only
      templateData = {
        primary_color: '#007bff',
        secondary_color: '#6c757d',
        background_color: '#ffffff',
        text_color: '#333333',
        logo_alignment: 'center',
        logo_size: 'medium',
        footer_text: '© A.L.M Infissi - Tutti i diritti riservati. P.Iva 06365120820',
        footer_color: '#888888',
        header_alignment: 'center',
        body_alignment: 'left',
        font_family: 'Arial, sans-serif',
        font_size: 'medium',
        button_color: '#007bff',
        button_text_color: '#ffffff',
        border_radius: '6px',
        show_details_button: true,
        show_leave_details: true,
        show_admin_notes: true,
        admin_notes_bg_color: '#f8f9fa',
        admin_notes_text_color: '#495057',
        leave_details_bg_color: '#e3f2fd',
        leave_details_text_color: '#1565c0',
        show_custom_block: false,
        custom_block_text: '',
        custom_block_bg_color: '#fff3cd',
        custom_block_text_color: '#856404',
        text_alignment: 'left',
        subject: null,
        content: null,
        show_admin_message: false,
        admin_message_bg_color: '#e3f2fd',
        admin_message_text_color: '#1565c0',
        show_button: true,
        button_text: 'Accedi alla Dashboard',
        button_url: 'https://alm-app.lovable.app/',
      };
      console.log("[Notification Email] No custom template found, using minimal fallback styling only");
    }

    // Use global logo settings if available, otherwise fallback to template or default
    let logoUrl = adminSetting.global_logo_url;
    let logoAlignment = adminSetting.global_logo_alignment || templateData.logo_alignment || 'center';
    let logoSize = adminSetting.global_logo_size || templateData.logo_size || 'medium';
    
    if (!logoUrl) {
      logoUrl = templateData.logo_url;
      if (!logoUrl) {
        const { data: logoData } = await supabase.storage
          .from('company-assets')
          .getPublicUrl(`${adminSettingsUserId}/email-logo.png?v=${Date.now()}`);
        logoUrl = logoData?.publicUrl;
      }
    }

    console.log("[Notification Email] Using logoUrl:", logoUrl);
    console.log("[Notification Email] Logo settings - alignment:", logoAlignment, "size:", logoSize);

    // Get recipients list - FIXED: Only admin for employee requests
    let recipients = [];
    console.log("[Notification Email] Determining recipients for recipientId:", recipientId, "templateType:", templateType);
    
    if (!recipientId) {
      // CORRECTED: For ALL employee requests (permessi/ferie/documents), send ONLY to administrators
      if (templateType === 'permessi-richiesta' || templateType === 'ferie-richiesta' || (employeeEmail && templateType === 'documenti')) {
        console.log("[Notification Email] Sending to all admins for employee request");
        const { data: adminProfiles, error: adminProfilesError } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .eq("role", "admin")
          .eq("is_active", true);
          
        if (adminProfilesError) {
          console.error("[Notification Email] Error fetching admin profiles:", adminProfilesError);
          throw adminProfilesError;
        }
        recipients = adminProfiles || [];
        console.log("[Notification Email] Found admin recipients:", recipients.length);
      } else {
        // Send to all active employees for admin notifications
        console.log("[Notification Email] Sending to all employees for admin notification");
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name")
          .eq("is_active", true);
          
        if (profilesError) {
          console.error("[Notification Email] Error fetching profiles:", profilesError);
          throw profilesError;
        }
        recipients = profiles || [];
        console.log("[Notification Email] Found employee recipients:", recipients.length);
      }
    } else {
      // Send to specific recipient
      console.log("[Notification Email] Sending to specific recipient:", recipientId);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .eq("id", recipientId)
        .single();
        
      if (profileError) {
        console.error("[Notification Email] Error fetching recipient profile:", profileError);
        throw profileError;
      }
      recipients = profile ? [profile] : [];
      console.log("[Notification Email] Found specific recipient:", recipients.length);
    }

    console.log("[Notification Email] Recipients found:", recipients.length);

    // Get admin profile for fallback sender info
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", adminSettingsUserId)
      .single();

    // Use configured sender settings with intelligent fallbacks
    let senderName, senderEmail;
    
    if (adminSetting.sender_name && adminSetting.sender_name.trim()) {
      senderName = adminSetting.sender_name.trim();
    } else if (adminProfile?.first_name && adminProfile?.last_name) {
      senderName = `${adminProfile.first_name} ${adminProfile.last_name}`;
    } else {
      senderName = "Sistema Notifiche";
    }

    if (adminSetting.sender_email && adminSetting.sender_email.trim()) {
      senderEmail = adminSetting.sender_email.trim();
    } else {
      senderEmail = "zerkraptor@gmail.com"; // Fallback verified email
    }

    console.log("[Notification Email] Using sender:", senderName, "<" + senderEmail + ">");

    // Determine if we should use employee email as reply-to
    let dynamicReplyTo = null;
    const isEmployeeToAdminNotification = templateCategory === 'dipendenti' && employeeEmail;
    
    if (isEmployeeToAdminNotification) {
      dynamicReplyTo = employeeEmail;
      console.log("[Notification Email] Using employee email as reply-to:", employeeEmail);
    } else if (adminSetting.reply_to && adminSetting.reply_to.trim()) {
      dynamicReplyTo = adminSetting.reply_to.trim();
      console.log("[Notification Email] Using configured reply-to:", dynamicReplyTo);
    }

    let successCount = 0;
    const errors = [];

    // FIXED: Initialize finalAdminMessage correctly for all leave response types
    let finalAdminMessage = '';
    const isLeaveResponse = templateType.includes('approvazione') || templateType.includes('rifiuto');
    
    if (isLeaveResponse) {
      // For leave responses, use adminNote if available, otherwise use emailBody
      finalAdminMessage = adminNote || emailBody || adminMessage || '';
    } else {
      // For other types, use adminMessage or emailBody
      finalAdminMessage = adminMessage || emailBody || '';
    }

    for (const recipient of recipients) {
      try {
        console.log("[Notification Email] Preparing email for recipient:", recipient.email);
        
        const attachmentSection = buildAttachmentSection(null, templateData.primary_color);
        
        const isDocumentEmail = templateType === 'documenti';
        const isNotificationEmail = templateType === 'notifiche';
        
        // NEW: DYNAMIC CONTENT LOGIC FOR ADMIN NOTIFICATION TEMPLATES
        let emailSubject, emailContent;
        
        if (isAdminNotificationTemplate) {
          // ADMIN NOTIFICATION TEMPLATE: Always use dynamic content from form
          console.log("[Notification Email] ADMIN NOTIFICATION TEMPLATE - Using dynamic content from form");
          
          // Subject: Use template subject if form subject is empty, otherwise use form subject
          if (subject && subject.trim()) {
            emailSubject = subject.trim();
            console.log("[Notification Email] Using form subject:", emailSubject);
          } else if (emailTemplate && emailTemplate.subject && emailTemplate.subject.trim()) {
            emailSubject = emailTemplate.subject.trim();
            console.log("[Notification Email] Using template subject:", emailSubject);
          } else {
            emailSubject = 'Notifica Sistema';
            console.log("[Notification Email] Using default subject:", emailSubject);
          }
          
          // Content: Always use form content for admin notifications
          emailContent = shortText || 'Hai ricevuto una nuova notifica.';
          console.log("[Notification Email] Using form content:", emailContent);
        } else if (emailTemplate && emailTemplate.subject && emailTemplate.content) {
          // OTHER TEMPLATES: Use database template content - NEVER use frontend content
          emailSubject = emailTemplate.subject;
          emailContent = emailTemplate.content;
          console.log("[Notification Email] USING DATABASE TEMPLATE - ABSOLUTE PRIORITY");
          console.log("[Notification Email] Database template subject:", emailSubject);
          console.log("[Notification Email] Database template content preview:", emailContent.substring(0, 100) + "...");
        } else {
          // ONLY FALLBACK: Use frontend content when NO database template exists
          // CRITICAL: For leave responses without database template, provide minimal fallback
          if (isLeaveResponse) {
            console.log("[Notification Email] CRITICAL: Leave response without database template detected");
            // Provide minimal fallback for leave responses
            if (templateType === 'permessi-approvazione') {
              emailSubject = 'Richiesta Permesso Approvata';
              emailContent = 'La tua richiesta di permesso è stata approvata.';
            } else if (templateType === 'ferie-approvazione') {
              emailSubject = 'Richiesta Ferie Approvata';
              emailContent = 'La tua richiesta di ferie è stata approvata.';
            } else if (templateType === 'permessi-rifiuto') {
              emailSubject = 'Richiesta Permesso Rifiutata';
              emailContent = 'La tua richiesta di permesso è stata rifiutata.';
            } else if (templateType === 'ferie-rifiuto') {
              emailSubject = 'Richiesta Ferie Rifiutata';
              emailContent = 'La tua richiesta di ferie è stata rifiutata.';
            } else {
              emailSubject = subject || 'Notifica Leave Request';
              emailContent = shortText || 'Hai ricevuto una notifica.';
            }
            console.log("[Notification Email] Using minimal leave response fallback");
          } else {
            // For other types, use frontend provided content
            emailSubject = subject || 'Notifica Sistema';
            emailContent = shortText || 'Hai ricevuto una nuova notifica.';
          }
          console.log("[Notification Email] FALLBACK CONTENT - No database template found");
          console.log("[Notification Email] Using subject:", emailSubject);
          console.log("[Notification Email] Using content:", emailContent);
        }
        
        // ENHANCED VARIABLE SUBSTITUTION WITH DETAILED LOGGING
        console.log("[Notification Email] Starting variable substitution for template type:", templateType);
        console.log("[Notification Email] Employee name provided:", employeeName);
        console.log("[Notification Email] Employee note provided:", employeeNote);
        console.log("[Notification Email] Admin message provided:", finalAdminMessage);
        console.log("[Notification Email] Template category:", templateCategory);
        console.log("[Notification Email] Is leave response:", isLeaveResponse);
        console.log("[Notification Email] Show admin message setting:", templateData.show_admin_message);

        // FIXED: Enhanced variable substitution with separate employee_name and recipient_name
        console.log("[Notification Email] Enhanced variable substitution:");
        console.log("  Template type:", templateType);
        console.log("  Original subject:", emailSubject);
        console.log("  Original content:", emailContent.substring(0, 100) + "...");
        console.log("  Employee name (sender):", employeeName || 'N/A');
        
        const recipientName = recipient.first_name && recipient.last_name 
          ? `${recipient.first_name} ${recipient.last_name}`
          : recipient.email;
        
        console.log("  Recipient name:", recipientName);
        
        // FIXED: Separate substitution for employee_name (sender) and recipient_name (recipient)
        // Replace {employee_name} with the actual employee name (sender)
        const finalEmployeeName = employeeName || 'Dipendente';
        emailSubject = emailSubject.replace(/{employee_name}/g, finalEmployeeName);
        emailContent = emailContent.replace(/{employee_name}/g, finalEmployeeName);
        
        // Replace {recipient_name} with the actual recipient name
        emailSubject = emailSubject.replace(/{recipient_name}/g, recipientName);
        emailContent = emailContent.replace(/{recipient_name}/g, recipientName);
        
        console.log("  Final subject:", emailSubject);
        console.log("  Final content preview:", emailContent.substring(0, 100) + "...");

        // CRITICAL: Do NOT replace {admin_message} placeholder in content
        // The admin message will be handled by the template system in the dedicated section
        console.log("[Notification Email] NOT replacing {admin_message} placeholder - template will handle it");

        console.log("[Notification Email] Final email subject:", emailSubject);
        console.log("[Notification Email] Final email content preview:", emailContent.substring(0, 100) + "...");
        console.log("[Notification Email] Template database usage:", !!emailTemplate);
        console.log("[Notification Email] Admin message to pass:", finalAdminMessage);
        
        // FIXED: Enhanced logging for employee notes
        console.log("[Notification Email] Employee notes to pass:", employeeNote);
        console.log("[Notification Email] Template show_admin_notes setting:", templateData.show_admin_notes);

        // FIXED: Properly format leave details for ALL leave request and response types
        let leaveDetails = '';
        const isLeaveRequest = templateType === 'permessi-richiesta' || templateType === 'ferie-richiesta';
        
        if ((isLeaveRequest || isLeaveResponse) && emailBody) {
          // For all leave-related emails, format the leave details from the email body
          leaveDetails = emailBody;
          console.log("[Notification Email] Leave-related email detected, formatting details:", leaveDetails);
        }

        const htmlContent = buildHtmlContent({
          subject: emailSubject,
          shortText: emailContent,
          logoUrl,
          attachmentSection,
          senderEmail,
          isDocumentEmail,
          templateType,
          primaryColor: templateData.primary_color,
          backgroundColor: templateData.background_color,
          textColor: templateData.text_color,
          logoAlignment,
          footerText: templateData.footer_text,
          footerColor: templateData.footer_color,
          fontFamily: templateData.font_family,
          buttonColor: templateData.button_color,
          buttonTextColor: templateData.button_text_color,
          borderRadius: templateData.border_radius,
          logoSize,
          headerAlignment: templateData.header_alignment,
          bodyAlignment: templateData.body_alignment,
          fontSize: templateData.font_size,
          showDetailsButton: templateData.show_details_button,
          showLeaveDetails: templateData.show_leave_details,
          showAdminNotes: templateData.show_admin_notes,
          // FIXED: Pass properly formatted leave details for all leave types
          leaveDetails: leaveDetails,
          // FIXED: Pass admin notes correctly for leave responses
          adminNotes: isLeaveResponse ? (adminNote || '') : '',
          // FIXED: Pass employee notes correctly for leave requests
          employeeNotes: isLeaveRequest ? (employeeNote || '') : '',
          leaveDetailsBgColor: templateData.leave_details_bg_color,
          leaveDetailsTextColor: templateData.leave_details_text_color,
          adminNotesBgColor: templateData.admin_notes_bg_color,
          adminNotesTextColor: templateData.admin_notes_text_color,
          showCustomBlock: templateData.show_custom_block,
          customBlockText: templateData.custom_block_text,
          customBlockBgColor: templateData.custom_block_bg_color,
          customBlockTextColor: templateData.custom_block_text_color,
          dynamicSubject: emailSubject,
          dynamicContent: emailContent,
          employeeEmail: employeeEmail,
          // FIXED: Pass admin message parameters correctly for leave responses
          showAdminMessage: templateData.show_admin_message && isLeaveResponse,
          adminMessage: finalAdminMessage,
          adminMessageBgColor: templateData.admin_message_bg_color,
          adminMessageTextColor: templateData.admin_message_text_color,
          // NEW: Pass recipient name to template
          recipientName: recipientName,
          // NEW: Pass button configuration to template
          showButton: templateData.show_button,
          buttonText: templateData.button_text,
          buttonUrl: templateData.button_url,
        });

        // Email sending configuration
        const emailConfig: any = {
          sender: { email: senderEmail, name: senderName },
          to: [{ email: recipient.email, name: recipientName }],
          subject: emailSubject,
          htmlContent: htmlContent,
        };

        if (dynamicReplyTo) {
          emailConfig.replyTo = { email: dynamicReplyTo };
          console.log("[Notification Email] Setting reply-to:", dynamicReplyTo);
        }

        console.log("[Notification Email] Sending email to:", recipient.email, "with sender:", senderEmail);

        // Send email via Brevo
        const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": adminSetting.brevo_api_key,
          },
          body: JSON.stringify(emailConfig),
        });

        if (!brevoResponse.ok) {
          const errorText = await brevoResponse.text();
          console.error(`[Notification Email] Brevo API error for ${recipient.email}:`, errorText);
          errors.push(`Failed to send to ${recipient.email}: ${errorText}`);
          continue;
        }

        const brevoResult = await brevoResponse.json();
        console.log("[Notification Email] Email sent successfully to", recipient.email);
        successCount++;

      } catch (error) {
        console.error(`[Notification Email] Error sending email to ${recipient.email}:`, error);
        errors.push(`Failed to send to ${recipient.email}: ${error.message}`);
      }
    }

    console.log("[Notification Email] Email sending completed!");
    console.log("[Notification Email] Success count:", successCount);
    console.log("[Notification Email] Errors:", errors);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emails sent to ${successCount} recipients`,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("[Notification Email] Function error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send notification email", 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
