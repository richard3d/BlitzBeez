#pragma strict
var m_Target : GameObject;
var m_PlayerPrefab : GameObject = null;
var m_CamPos : Vector3;
var m_ShakeStrength : float = 0;
var m_fShakeTimer : float = 0;
var m_fShakeTime : float = 0;
var m_CamVel : Vector3;
var m_CamDrag : float;
var m_Offset:Vector3 = Vector3(0,0,200);
var m_ThirdPerson : boolean = false;
var m_Fixed : boolean = false;
var m_Freeze: boolean = false;
function Start () {

	m_CamPos = transform.position;
	// if(Network.isServer)
	// {
		// var server : ServerScript = GameObject.Find("GameServer").GetComponent(ServerScript) as ServerScript;
		
			
		
	// }
}

function Update () {

	if(Network.isClient)
	{
		var client : ClientScript = GameObject.Find("GameClient").GetComponent(ClientScript) as ClientScript;
		m_Target = client.GetClient(client.m_ClientID).m_GameObject;
	}
	else if(Network.isServer)
	{
		m_Target = gameObject.Find("Bee0");
	}
	
	if(!m_Target || m_Freeze)
		return;
	if(GetComponent(Camera).orthographic)
	{
		if(m_CamVel.magnitude - m_CamDrag * Time.deltaTime <= 0)
				m_CamVel = Vector3(0,0,0);
			else
				m_CamVel -= m_CamVel.normalized * m_CamDrag* Time.deltaTime;
				
		//m_CamVel += m_CamAccel* Time.deltaTime;
		Camera.main.orthographicSize += m_CamVel.y * Time.deltaTime;
		var camVel = Vector3(m_CamVel.x, 0, m_CamVel.z);
		m_CamPos += camVel * Time.deltaTime;
		transform.position = m_CamPos;
		
		
	}
	else
	{
		
		var diff:Vector3;
		//transform.LookAt(Vector3(m_Target.transform.position.x,0,m_Target.transform.position.z));
		if(m_Fixed)
		{
			diff = -transform.forward;
			diff.y = 0;
			diff = m_Target.transform.position+diff.normalized * m_Offset.z - transform.position;
			diff.y = 0;
		}
		else
			diff = m_Target.transform.position - transform.position - (m_Offset.x*m_Target.transform.right+m_Offset.y*m_Target.transform.up+m_Offset.z*m_Target.transform.forward);
		
		//diff.y = 0;
		m_CamVel = diff*2;
		m_CamPos += m_CamVel * Time.deltaTime;
		
		if(m_fShakeTime > 0)
		{
			
			var ShakeOffset : Vector3 = Random.Range(-1, 1) * transform.up + Random.Range(-1, 1) * transform.right;
			ShakeOffset = ShakeOffset.normalized *m_ShakeStrength;
			m_fShakeTime -= Time.deltaTime;
			transform.position = m_CamPos +  ShakeOffset;
			transform.LookAt(Vector3(m_Target.transform.position.x,0,m_Target.transform.position.z)+  ShakeOffset);
		}
		else
		{
			m_ShakeStrength = 0.0;
			transform.position = m_CamPos;
			transform.LookAt(Vector3(m_Target.transform.position.x,0,m_Target.transform.position.z));
		}
		
	}
}

function Shake(time : float , strength : float)
{	
    m_ShakeStrength = strength;
	m_fShakeTime = time;
}

function OnPostRender()
{
	var guis:GameObject[] = gameObject.FindGameObjectsWithTag("GUI");
	for(var gui:GameObject in guis)
	{
		gui.GetComponent(BillboardScript).Draw();
	}
}

function SetFocalPosition(pos:Vector3)
{
	var myPos:Vector3 = pos;
	myPos.y = 0;
	var camPos:Vector3 = Camera.main.transform.position;
	camPos.y = 0;
	
	Debug.Log("focpos");
	if(m_Target != null)
	{
		m_CamPos +=  (myPos-camPos) - (m_Offset.x*m_Target.transform.right+m_Offset.y*m_Target.transform.up+m_Offset.z*m_Target.transform.forward);
	}
	
	
}