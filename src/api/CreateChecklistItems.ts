import { spWebContext } from "providers/SPWebContext";
import { IInRequest } from "api/RequestApi";
import { EMPTYPES } from "constants/EmpTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RoleType } from "api/RolesApi";
import { ICheckListItem } from "./CheckListItemApi";

export enum templates {
  WelcomePackage = 1, // TODO
  IA_Training = 2,
  ObtainCACGov = 3,
  ObtainCACCtr = 4,
  InstallationInProcess = 5, // TODO
  GTC = 6, // TODO
  DTS = 7, // TODO
  ATAAPS = 8, // TODO
  VerifyMyLearn = 9,
  VerifyMyETMS = 10,
  MandatoryTraining = 11,
  PhoneSetup = 12,
  OrientationVideos = 13,
  Bookmarks = 14,
  NewcomerBrief = 15,
  SupervisorTraining = 16,
}

const createInboundChecklistItems = (request: IInRequest) => {
  const [batchedSP, execute] = spWebContext.batched();

  const checklistItems = batchedSP.web.lists.getByTitle("CheckListItems");

  // IA Training
  // Required for all inbounds
  checklistItems.items.add({
    Title: "IA Training Complete",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.IA_Training,
    Active: true,
    Description: `<div><p style="margin-top: 0px">Information Assurance (IA) Training is an annual requirement. It is accomplished by completing the Cyber Awareness Challenge. It is mandatory that each employee be current in this training. Below are links to both a public (non-CAC) method for obtaining IA Training as well as myLearning for those with CACs. <b>Supervisors should provide non-CAC new employees with appropriate public website (item #1 below) so employee may complete training prior to installation in-processing.</b> If you have previously taken IA Training as a government employee and would like to check your training currency, go to Air Force myLearning below and view your training transcript.</p> 
<p>1) No CAC - <a href="https://public.cyber.mil/training/cyber-awareness-challenge/">https://public.cyber.mil/training/cyber-awareness-challenge/</a><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a) Upon completing the Cyber Awareness Challenge, download the completion certificate as a PDF, and send it to your supervisor and to the AFLCMC/OZI Enterprise Tech Team &lt;<a href="mailto:AFLCMC.OZI.EnterpriseTechTeam@us.af.mil">AFLCMC.OZI.EnterpriseTechTeam@us.af.mil</a>&gt;</p> 
<p>2) CAC - Air Force myLearning (<a href="https://lms-jets.cce.af.mil/moodle/">https://lms-jets.cce.af.mil/moodle/</a>)<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a) Once within the website, click on the Total Force Awareness Training Button, then scroll down to the Cyber Awareness Challenge and select the training.</p>
</div>`,
  } as ICheckListItem);

  // Installation In Processing (required for new Mil/Civ)
  if (request.isNewCivMil === "yes") {
    checklistItems.items.add({
      Title: "Attend Installation In-processing",
      Lead: RoleType.EMPLOYEE,
      RequestId: request.Id,
      TemplateId: templates.InstallationInProcess,
      Active: true,
      Description: `<div><p style="margin-top: 0px">Did you attend the 88FSS installation in-processing? </p></div>`,
    } as ICheckListItem);
  }

  // Obtain/Transfer CAC (Mil/Civ)
  if (
    request.empType === EMPTYPES.Civilian ||
    request.empType === EMPTYPES.Military
  ) {
    checklistItems.items.add({
      Title: "Obtain CAC (Mil/Civ)",
      Lead: RoleType.EMPLOYEE,
      RequestId: request.Id,
      TemplateId: templates.ObtainCACGov,
      Active: !(request.isNewCivMil === "yes"),
      Description: `<div><p style="margin-top: 0px"><b>Initial CAC for brand new employees</b><br/>
For brand new employees who have not yet obtained their CAC, please see 'Installation In-processing' as this task will address enrollment in the Defense Enrollment Eligibility Reporting System (DEERS) and provide guidance for scheduling a CAC appointment.</p>
<p><b>Replacement CAC</b><br/>
To schedule your CAC appointment see the following announcement:</p>
<p>The 88 Force Support ID Card Section is transitioning from RAPIDS to Setmore for scheduling ID card appointments. This includes all CAC, Retiree, Dependents, and DAV customers.<br/><br/>
Transition Timeframe: <br/>
-Beginning Nov 1, 2022, 60 day out appointments (Jan 1, 2023 and beyond) will be released on Setmore.<br />
-Weekly appointments will continue to be released on RAPIDS until Dec 27, 2022, from which all appointments will need to be booked on Setmore</p>
<p>Customers can continue to self-book services online 24/7 via our website, <a href="https://www.wrightpattfss.com/military-personnel">https://www.wrightpattfss.com/military-personnel</a>; or
customers can access Setmore/RAPIDS sites directly at the following links:<br/>
Setmore: <a href="https://88fss.setmore.com/88fss">https://88fss.setmore.com/88fss</a><br/>
RAPIDS website: <a href="https://idco.dmdc.os.mil/idco/">https://idco.dmdc.os.mil/idco/</a><br/></p></div>`,
    } as ICheckListItem);
  }

  // Obtain/Transfer CAC (Ctr)
  if (request.empType === EMPTYPES.Contractor) {
    checklistItems.items.add({
      Title: "Obtain/Transfer CAC (Ctr)",
      Lead: RoleType.EMPLOYEE,
      RequestId: request.Id,
      TemplateId: templates.ObtainCACCtr,
      Active: true,
      Description: `<div><p style="margin-top: 0px"><b><u>CAC Transfer</u></b><br/>This applies to contractors who meet the following conditions:
<ol><li>Possess a CAC issued under a DoD contract</li><li>Changing contracts away from the one which authorized and is associated with the CAC</li><li>Remaining in the employment of the same contractor through whom the CAC was issued</li></ol></p>
<p>If you have current CAC issued under a government contract that you are changing and yet remaining with the same contractor, you may not be required to obtain a new CAC but may transfer the one you have. However, this requires working with your security office to coordinate the updating of your CAC to the appropriate contract.</p>
<p><b><u>Obtain New or Replacement CAC</u></b><br/>To schedule your CAC appointment see the following announcement:</p>
<p>The 88 Force Support ID Card Section is transitioning from RAPIDS to Setmore for scheduling ID card appointments. This includes all CAC, Retiree, Dependents, and DAV customers.<br/><br/>
Transition Timeframe: <br/>
-Beginning Nov 1, 2022, 60 day out appointments (Jan 1, 2023 and beyond) will be released on Setmore.<br />
-Weekly appointments will continue to be released on RAPIDS until Dec 27, 2022, from which all appointments will need to be booked on Setmore</p>
<p>Customers can continue to self-book services online 24/7 via our website, <a href="https://www.wrightpattfss.com/military-personnel">https://www.wrightpattfss.com/military-personnel</a>; or
customers can access Setmore/RAPIDS sites directly at the following links:<br/>
Setmore: <a href="https://88fss.setmore.com/88fss">https://88fss.setmore.com/88fss</a><br/>
RAPIDS website: <a href="https://idco.dmdc.os.mil/idco/">https://idco.dmdc.os.mil/idco/</a><br/></p></div>`,
    } as ICheckListItem);
  }

  // Verify Air Force myLearning account
  checklistItems.items.add({
    Title: "Verify Air Force myLearning account",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.VerifyMyLearn,
    Active: false,
    Description: `<div><p style="margin-top: 0px">As part of in-processing, all employees are to verify or register for an Air Force myLearning training account. This account is necessary for the completion of mandatory training requirements.</p>
<p><a href="https://lms-jets.cce.af.mil/moodle/">Air Force MyLearning</a></p></div>`,
  } as ICheckListItem);

  // Verify AFMC myETMS account
  if (
    request.empType === EMPTYPES.Civilian ||
    request.empType === EMPTYPES.Military
  ) {
    checklistItems.items.add({
      Title: "Verify AFMC myETMS account",
      Lead: RoleType.EMPLOYEE,
      RequestId: request.Id,
      TemplateId: templates.VerifyMyETMS,
      Active: false,
      Description: `<div><p style="margin-top: 0px">Click here for link to myETMS: <a href="https://myetms.wpafb.af.mil/myetmsasp/main.asp">Air Force Materiel Command's myEducation and Training Management System</a></p></div>`,
    } as ICheckListItem);
  }

  // Mandatory training (all employees)
  checklistItems.items.add({
    Title: "Complete mandatory training",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.MandatoryTraining,
    Active: false,
    Description: `<div><p style="margin-top: 0px">The table below provides a course list of mandatory training for all employees. Employee status can be found for these courses in MyLearning and MyETMS. Course enrollment will be accomplished via MyLearning. Please confirm all training requirements are met prior to completing this checklist item.</p>
    <p><a href="https://lms-jets.cce.af.mil/moodle/course/index.php?categoryid=173">myLearning - Total Force Awareness Training (TFAT)</a><br/>
    <a href="https://myetms.wpafb.af.mil/myetmsasp/main.asp">myETMS - Training Requirements</a></p>
<b><u>Mandatory Training Courses</u></b>
<table valign=top border=1 cellspacing=0 cellpadding=0 width=0 style="border-collapse:collapse; border: 1px solid blue; vertical-align: top">
 <tr><td width="60%" align=center style="background:blue"><b><span style="color:white">Course Title</span></b></td><td width="40%" align=center style="background:blue"><b><span style="color:white">Frequency</span></b></td></tr>
 <tr><td>DAF-Operations Security Awareness Training (OPSEC)</td><td>Annual</td></tr>
 <tr><td>TFAT - Cyber Awareness Challenge (ZZ133098)</td><td>Annual</td></tr>
 <tr><td>Force Protection (ZZ133079)</td><td>Annual</td></tr>
 <tr><td>2022 Annual Ethics Training</td><td>Annual</td></tr>
 <tr><td>Notification and Federal Employee Antidiscrimination and Retaliation Act (No FEAR) Training V1.0</td><td>Initial training within 90 calendar days of the new employees' appointment; then every 24 months</td></tr>
 <tr><td>Controlled Unclassified Information (CUI) Training (ZZZ2021CUI)</td><td>Annual</td></tr>
 <tr><td>Religious Freedom Training (ZZ133109)</td><td>Every 3 years</td></tr>
</table></div>`,
  } as ICheckListItem);

  // Supervisor training (Supervisory positions only)
  if (request.isSupervisor === "yes") {
    checklistItems.items.add({
      Title: "Complete supervisor training",
      Lead: RoleType.EMPLOYEE,
      RequestId: request.Id,
      TemplateId: templates.SupervisorTraining,
      Active: true,
      Description: `<div><p style="margin-top: 0px">Please look for Air University to provide guidance (online training link) for the completion of all appropriate supervisor training requirements.</p></div>`,
    } as ICheckListItem);
  }

  // Set up phone system (all Employees) -- requires user to have CAC first
  checklistItems.items.add({
    Title: "Set up phone system",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.PhoneSetup,
    Active: false,
    Description: `<p style="margin-top: 0px">See the following link for phone set up instructions: <a href="https://www.tsf.wpafb.af.mil/Doc/Getting%20Started%20with%20the%20UC%20Client.pdf">Getting started with the UC Client</a></p>`,
  } as ICheckListItem);

  // Watch Orientation Videos (all Employees) -- requires user to have CAC first
  checklistItems.items.add({
    Title: "View orientation videos",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.OrientationVideos,
    Active: false,
    Description: `<p style="margin-top: 0px">The orientation videos may be found within the following document: <a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/New%20Employee%20Websites.docx">New Employee Websites.docx</a></p>`,
  } as ICheckListItem);

  // Bookmark SharePoint/Websites (all Employees) -- requires user to have CAC first
  checklistItems.items.add({
    Title: "Bookmark key SharePoint / Website URLs",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.Bookmarks,
    Active: false,
    Description: `<p style="margin-top: 0px">Bookmark the links located in the document located here: <a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/New%20Employee%20Websites.docx">New Employee Websites.docx</a></p>`,
  } as ICheckListItem);

  // Newcomer Breifing (all Employees) -- requires user to have CAC first
  checklistItems.items.add({
    Title: "Review directorate newcomer brief",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.NewcomerBrief,
    Active: false,
    Description: `<p style="margin-top: 0px">Review directorate newcomer brief located here: <a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/AFLCMC%20-%20XP-OZ%20Overview.pptx">AFLCMC - XP-OZ Overview.pptx</a></p>`,
  } as ICheckListItem);

  // GTC/DTS
  if (request.isTraveler === "yes") {
    checklistItems.items.add({
      Title: "GTC In-processing",
      Lead: RoleType.GTC,
      RequestId: request.Id,
      TemplateId: templates.GTC,
      Active: true,
      Description: "",
    } as ICheckListItem);
    checklistItems.items.add({
      Title: "DTS In-processing",
      Lead: RoleType.DTS,
      RequestId: request.Id,
      TemplateId: templates.DTS,
      Active: true,
      Description: "",
    } as ICheckListItem);
  }

  // ATAAPS
  if (request.empType === EMPTYPES.Civilian) {
    checklistItems.items.add({
      Title: "ATAAPS In-processing",
      Lead: RoleType.ATAAPS,
      RequestId: request.Id,
      TemplateId: templates.ATAAPS,
      Active: false,
      Description: "",
    } as ICheckListItem);
  }

  // Training In-processing
  // Security In-processing
  // Supervisor In-processing
  // ETT In-processing

  return execute();
};

export const useAddTasks = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ["checklist"],
    (newRequest: IInRequest) => {
      return createInboundChecklistItems(newRequest);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["checklist"]);
      },
    }
  );
};
