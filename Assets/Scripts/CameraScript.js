#pragma strict
var m_Target : GameObject;
var m_PlayerPrefab : GameObject = null;
var m_CamPos : Vector3;
var m_ShakeStrength : float = 0;
var m_fShakeTimer : float = 0;
var m_fShakeTime : float = 0;
var m_CamVel : Vector3;
var m_Offset:Vector3 = Vector3(0,0,200);


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
	if(!m_Target)
		return;

	var diff = m_Target.transform.position - transform.position - m_Offset;
	diff.y = 0;
	m_CamVel = diff;
	m_CamPos += m_CamVel * Time.deltaTime;
	
	if(m_fShakeTime > 0)
	{
		
		var ShakeOffset : Vector3 = Random.Range(-1, 1) * transform.up + Random.Range(-1, 1) * transform.right;
        ShakeOffset = ShakeOffset.normalized *m_ShakeStrength;
		m_fShakeTime -= Time.deltaTime;
		transform.position = m_CamPos +  ShakeOffset;
	}
	else
	{
		m_ShakeStrength = 0.0;
		transform.position = m_CamPos;
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
	m_CamPos +=  (myPos-camPos) - m_Offset;
}