#pragma strict

private var m_MovementKeyPressed : boolean = false;
private var m_MovementSpeed : float = 240;

var m_MovementEnabled : boolean = true;

function Start () {
	
}

function Update()
{
	GetComponent(BeeControllerScript).m_ControlEnabled = false;
	GetComponent(BeeControllerScript).m_LookEnabled = false;
	
	
}



function OnNetworkInput(IN : InputState)
{
	if(!networkView.isMine)
	{
		return;
	}
	
	var Updater : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
		Updater.m_Accel = Vector3(0,0,0);
	if(!m_MovementKeyPressed)
	{
		
		
		var currSpeed : float = Updater.m_Vel.magnitude;
		if(currSpeed - 5* Time.deltaTime <= 0)
		{
			Updater.m_Vel = Vector3(0,0,0);
		}
		else
		{
			Updater.m_Vel -= GetComponent(UpdateScript).m_Vel.normalized * 5 * Time.deltaTime;
		}
	}
	
	if(!m_MovementEnabled)
	{
		Updater.m_Vel = Vector3(0,0,0);
		return;	
	}		
	m_MovementKeyPressed = false;
	var IsDashing : boolean = GetComponent(BeeDashDecorator) == null ? false : true;
	
	//handle essential strafe movements
	//we arent allowed to change direction if we hit the dash button though
	
	if(IN.GetAction(IN.MOVE_UP))
	{
		Updater.m_Vel = Vector3.forward *m_MovementSpeed;
		m_MovementKeyPressed = true;
	}
	else
	if(IN.GetAction(IN.MOVE_RIGHT))
	{
		Updater.m_Vel = Vector3.right*m_MovementSpeed;
		m_MovementKeyPressed = true;
	}
	else
	if(IN.GetAction(IN.MOVE_BACK))
	{
		Updater.m_Vel = -Vector3.forward*m_MovementSpeed;
		m_MovementKeyPressed = true;
	}
	else	
	if(IN.GetAction(IN.MOVE_LEFT))
	{
		Updater.m_Vel = -Vector3.right*m_MovementSpeed;
		m_MovementKeyPressed = true;
	}
	
	if(Updater.m_Vel.magnitude != 0)
		transform.LookAt(transform.position + Updater.m_Vel);
		
}
