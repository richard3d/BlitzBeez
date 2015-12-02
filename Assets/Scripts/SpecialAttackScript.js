#pragma strict
var m_TeamOwner : int = 0;
var m_HitSoundEffect : AudioClip = null;
function Start () {
	
	yield WaitForSeconds(0.5);
	//GetComponent(BoxCollider).enabled = true;
	
	
	var hitInfos:RaycastHit[] = Physics.SphereCastAll(transform.position, GetComponent(BoxCollider).size.x*0.5, transform.forward,500, 1<<LayerMask.NameToLayer("Players"));//       GetComponent(BoxCollider).bounds.Intersects(player.GetComponent(SphereCollider).bounds))
	for(var hitInfo:RaycastHit in hitInfos)
	{
		if(hitInfo.transform.GetComponent(BeeScript).m_Team == m_TeamOwner)
			continue;
		if(Network.isServer)
		{
			hitInfo.transform.GetComponent(BeeScript).KillAndRespawn(true);
		}
	}
	
	
	// var hives:GameObject[] = GameObject.FindGameObjectsWithTag("Hives");
	
	// for(var hive:GameObject in hives)
	// {
		// if(hive.GetComponent(RespawnScript).m_TeamOwner == m_TeamOwner)
			// continue;
		// if(GetComponent(BoxCollider).bounds.Intersects(hive.GetComponent(BoxCollider).bounds))
		// {
			// hitHive = hive;
			// break;
			// // if(Network.isServer)
			// // {
				// // player.GetComponent(BeeScript).KillAndRespawn(true);
			// // }
		// }
	// }
	
	hitInfos = Physics.SphereCastAll(transform.position, GetComponent(BoxCollider).size.x*0.5, transform.forward,500, 1<<LayerMask.NameToLayer("Hives"));
	for(var hitInfo:RaycastHit in hitInfos)
	{
		if(hitInfo.transform.GetComponent(RespawnScript).m_TeamOwner == m_TeamOwner)
			continue;
		else
		{
			
			//do all the hit effects over time
			var duration:float = 3;
			var delta:float = 0.1;
			var hitHive:GameObject = hitInfo.transform.gameObject;
			if(Network.isServer)
					hitHive.networkView.RPC("DamageHive", RPCMode.All, 20);
			while(duration > 0)
			{
				duration -= delta;
				
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
				
				yield WaitForSeconds(delta);
			}
			
			break;
		}
		
	}
	
	
	

}

function Update () {

}