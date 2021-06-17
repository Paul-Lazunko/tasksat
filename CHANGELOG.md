v1.1.0
* Added an errorCallback - function that will be executed when job failed
(will be executed after the reaching max attempts count or ttl value, for handling incomplete execution and removing previously created data);
* Provide abstract logger (console by default);

v1.3.0
* added successCallback - function that will be executed immediately after successful task execution
* added runSuccessCallbackWithHandlerResult boolean parameter that indicates how successCallback will be executed (with execution result for _true_ value and with provided params for _false_ value)
* moved successCallback and errorCallback to the job from the task to add ability async wrap job enqueue and execution

v1.4.0
* removed store
