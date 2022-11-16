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
<p>1) No CAC - <a href="https://public.cyber.mil/training/cyber-awareness-challenge/" target="_blank">https://public.cyber.mil/training/cyber-awareness-challenge/</a><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a) Upon completing the Cyber Awareness Challenge, download the completion certificate as a PDF, and send it to: <span style='color:red'>TBD</span></p> 
<p>2) CAC - Air Force myLearning (<a href="https://lms-jets.cce.af.mil/moodle/" target="_blank">https://lms-jets.cce.af.mil/moodle/</a>)<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a) Once within the website, click on the Total Force Awareness Training Button, then scroll down to the Cyber Awareness Challenge and select the training.</p>
</div>`,
  } as ICheckListItem);

  // Installation In Processing
  if (request.isNewCivMil === "yes") {
    checklistItems.items.add({
      Title: "Installation In-processing",
      Lead: RoleType.EMPLOYEE,
      RequestId: request.Id,
      TemplateId: templates.InstallationInProcess,
      Active: true,
      Description: "",
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
<p>Customers can continue to self-book services online 24/7 via our website, <a href="https://www.wrightpattfss.com/military-personnel" target="_blank">https://www.wrightpattfss.com/military-personnel</a>; or
customers can access Setmore/RAPIDS sites directly at the following links:<br/>
Setmore: <a href="https://88fss.setmore.com/88fss" target="_blank">https://88fss.setmore.com/88fss</a><br/>
RAPIDS website: <a href="https://idco.dmdc.os.mil/idco/" target="_blank">https://idco.dmdc.os.mil/idco/</a><br/></p></div>`,
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
<p>Customers can continue to self-book services online 24/7 via our website, <a href="https://www.wrightpattfss.com/military-personnel" target="_blank">https://www.wrightpattfss.com/military-personnel</a>; or
customers can access Setmore/RAPIDS sites directly at the following links:<br/>
Setmore: <a href="https://88fss.setmore.com/88fss" target="_blank">https://88fss.setmore.com/88fss</a><br/>
RAPIDS website: <a href="https://idco.dmdc.os.mil/idco/" target="_blank">https://idco.dmdc.os.mil/idco/</a><br/></p></div>`,
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
<p><a href="https://lms-jets.cce.af.mil/moodle/" target="_blank">Air Force MyLearning</a></p></div>`,
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
