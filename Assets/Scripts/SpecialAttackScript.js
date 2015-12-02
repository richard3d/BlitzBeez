#pragma strict
var m_TeamOwner : int = 0;
var m_Owner:GameObject = null;
var m_HitSoundEffect : AudioClip = null;
var m_Duration:float = 2;
function Start () {
	
	//look for hive collisions
	var hitHive:GameObject = null;
	var dmg : int = 5;
	
	var hitInfos:RaycastHit[] = Physics.SphereCastAll(transform.position, GetComponent(BoxCollider).size.x*0.5, transform.forward,500, 1<<LayerMask.NameToLayer("Hives"));
	for(var hitInfo:RaycastHit in hitInfos)
	{
		if(hitInfo.transform.GetComponent(RespawnScript).m_TeamOwner == m_TeamOwner)
			continue;
		else
		{
			
			//get the hive that was hit and calculate damage
			hitHive = hitInfo.transform.gameObject;
			
			var diff:Vector3 =hitHive.transform.position - transform.position;
			diff.y = 0;
			diff = diff - Vector3.Dot(diff, transform.forward)*transform.forward;	
			dmg = (1 - Mathf.Min(diff.magnitude / GetComponent(BoxCollider).size.x*0.5, 1)) * 20 + 1;
			
			
			break;
		}
	}	
	
	yield WaitForSeconds(0.5);
	//GetComponent(BoxCollider).enabled = true;
	
	//look for player collisions
	hitInfos = Physics.SphereCastAll(transform.position, GetComponent(BoxCollider).size.x*0.5, transform.forward,500, 1<<LayerMask.NameToLayer("Players"));
	for(var hitInfo:RaycastHit in hitInfos)
	{
		if(hitInfo.transform.GetComponent(BeeScript).m_Team == m_TeamOwner)
			continue;
		if(Network.isServer)
		{
			hitInfo.transform.GetComponent(BeeScript).KillAndRespawn(true);
		}
	}
	
	
	
	
	if(hitHive != null)
	{
		if(Network.isServer)
					hitHive.networkView.RPC("DamageHive", RPCMode.All, dmg);
	
		var d = m_Duration/dmg;
		DoHitEffect(3.0, d,hitHive);
	}
	
	
	

}

function DoHitEffect(duration:float, delta:float, hitHive:GameObject)
{

	var hitCount:int = 0;
	
	while(duration > 0)
	{
		duration -= delta;
		hitCount+= 1;
		var vertIndex:int = Random.Range(0, hitHive.GetComponent(MeshFilter).mesh.vertexCount-1);
		var pos:Vector3 = hitHive.GetComponent(MeshFilter).mesh.vertices[vertIndex];
		pos = hitHive.transform.TransformPoint(pos);
		var hitEffect:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/SpecialAttackHitEffect"), pos,Quaternion.identity);
		audio.PlayClipAtPoint(m_HitSoundEffect, hitHive.transform.position);
		if(hitHive.GetComponent(FlasherDecorator) == null)
		{
			hitHive.AddComponent(FlasherDecorator);
			hitHive.GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
			hitHive.GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
		}
		var kudosText :GameObject = null;
		if(gameObject.Find("HitText") != null)
		{
			kudosText = gameObject.Find("HitText");
		}
		else
		{
			kudosText = gameObject.Instantiate(Resources.Load("GameObjects/KudosText"));
		}
		
		kudosText.name = "HitText";
		kudosText.animation.Stop();
		kudosText.animation["KudosText"].time = 0;
		kudosText.animation.Play("KudosText");
		kudosText.GetComponent(GUIText).material.color =  hitCount %2 == 0 ? Color.yellow : Color.black;
		kudosText.GetComponent(KudosTextScript).m_WorldPos = hitHive.transform.position;
		kudosText.GetComponent(KudosTextScript).m_WorldPos.y = transform.position.y;
		kudosText.GetComponent(UpdateScript).m_Lifetime = 2;
		kudosText.GetComponent(GUIText).text = " "+hitCount+" Hits!";
		kudosText.GetComponent(GUIText).fontSize = 64;
		kudosText.GetComponent(KudosTextScript).m_CameraOwner = m_Owner.GetComponent(BeeScript).m_Camera;
		kudosText.layer = LayerMask.NameToLayer("GUILayer_P"+(m_Owner.GetComponent(NetworkInputScript).m_ClientOwner+1));
		
		yield WaitForSeconds(delta);
	}
}

function Update () {

}