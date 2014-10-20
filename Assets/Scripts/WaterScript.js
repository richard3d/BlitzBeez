#pragma strict

var m_OrigPosition:Vector3;
var m_Height :float = 0;
var m_MaxHeight :float = 0;
private var m_Rising:boolean = false;

function Start () {
m_OrigPosition = transform.position;
}

function Update () {



	if(m_Rising)
	{
		m_Height = Mathf.Lerp(m_Height, m_MaxHeight, Time.deltaTime*0.25);
		Camera.main.GetComponent(CameraScript).Shake(0.5, 1);
		if(Mathf.Abs(m_Height - m_MaxHeight) < 1)
		{
			m_Rising = false;
		}
	}
	transform.position.y = m_OrigPosition.y +m_Height+ Mathf.Sin(Time.time) *2;

	var amt = Time.deltaTime;
	renderer.material.mainTextureOffset.y -= amt*0.02;
	var offset = renderer.material.GetTextureOffset ("_BumpMap");
	renderer.material.SetTextureOffset ("_BumpMap", Vector2(0,offset.y+amt*0.02));

}

function OnTriggerEnter(coll : Collider)
{
	if(Network.isServer)
	{
		
		if(coll.gameObject.tag == "Player")
		{
			
			//coll.gameObject.AddComponent(DrowningDecorator);		
			//coll.gameObject.transform.position -= 
	
		}
	}
}

function OnSwitchActivated()
{
	if(m_Rising == false)
		m_Rising = true;
	else
		m_Rising = false;
}